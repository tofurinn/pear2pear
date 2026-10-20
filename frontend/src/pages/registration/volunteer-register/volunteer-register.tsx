import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "../../../firebase/config";
import { useAuth } from "../../../context/authContext";
import { mergePendingSignup } from "../../../firebase/pending-signup";
import { createVolunteer } from "../../../services/VolunteerService";
import { createAvailability, slotKeyToAvailability } from "../../../services/AvailabilityService";

import { updateUser } from "../../../services/UserService";
import Navbar from "../../../components/navbar/global-navbar";
import Step1 from "./volunteer-steps/step1";
import Step2 from "./volunteer-steps/step2";
import "./volunteer-register.css";

// Shape of volunteer data from step 1 and 2
export interface VolunteerProfileData {
  categories: string[];
  supportMode: "Physical" | "Virtual";
  skills: string[];
  availability: string[];
}

// Serves two distinct entry points:
// Registration and dashboard
type Flow = "signup" | "upgrade";

interface FlowConfig {
  backTo: string;       // where step 1's "Previous Page" goes
  successTo: string;    // where submit goes
}

// Centralised per-flow routing so URL changes only happen here
const FLOWS: Record<Flow, FlowConfig> = {
  signup: {
    backTo: "/user-registration",
    successTo: "/email-validation",
  },
  upgrade: {
    backTo: "/student/dashboard",
    successTo: "/volunteer-registered",
  },
};

interface VolunteerRegisterPageProps {
  flow?: Flow;
}

export default function VolunteerRegisterPage({flow = "signup",}: VolunteerRegisterPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [submitError, setSubmitError] = useState("");

  const { refreshUser } = useAuth();
  const { backTo, successTo } = FLOWS[flow];

  // Volunteer-specific data
  // Starts empty, step 1 and 2 filles it in
  const [profile, setProfile] = useState<VolunteerProfileData>({
    categories: [],
    supportMode: "Virtual",
    skills: [],
    availability: [],
  });

  // Move between steps by writing '?step=N' into URL
  const goToStep = (n: number) =>
    // Carries location.state forward so email survives step transition
    setParams({ step: String(n) }, { state: location.state });

  const handleSubmitAll = async () => {
    // UPGRADE FLOW
    // Does not redirect to "set-password"
    if (flow === "upgrade") {
      // User is already signed in, write directly to Firestore here
      const uid = auth.currentUser?.uid;
      if (!uid) {
        console.error("No authenticated user for upgrade flow");
        return;
      }

      try {
        // Flip the isVolunteer flag on the existing user doc
        await updateUser(uid, { isVolunteer: true });

        // Create the volunteer doc keyed by auth UID
        await createVolunteer(uid, {
          volCategories: profile.categories,
          prefSupportMode: profile.supportMode,
          skills: profile.skills,
          avgRating: 0,
        });

        // One availability doc per selected slot
        for (const slot of profile.availability) {
          await createAvailability(slotKeyToAvailability(slot, uid));
        }

        await refreshUser(); 

        navigate(successTo, { replace: true });
      } catch (err) {
        console.error("Volunteer upgrade failed:", err);
        // TODO: show an error to the user
      }
      return;
    }

    // SIGNUP FLOW
    // Doesn't write to Firestore yet, instead merges volunteer 
    // profile into pending signup stash
    mergePendingSignup({ volunteerProfile: profile });
    navigate(successTo, {
      state: { ...(location.state as object | null) },
    });

    try {
      navigate(successTo, { replace: true });
    } catch (err) {
      console.error(err);
      setSubmitError("Something went wrong. Please try again.");
    }
  };

  // Patch-style state updater so step 1/step 2 can send just the fields that
  // changed without affecting the rest
  const updateProfile = (patch: Partial<VolunteerProfileData>) =>
    setProfile((prev) => ({ ...prev, ...patch }));

  // Guard: step 2 is only reachable if step 1 has the required fields
  // Also protects from manual URL change to step 2
  const step1Done = profile.categories.length > 0 && profile.skills.length > 0;
  const step = params.get("step") === "2" && step1Done ? 2 : 1;

  return (
    <div className="ui-page register-page">
      <Navbar />

      <main className="register-main">
        <section className="register-card">
          <h1 className="register-card__title">Register as a Volunteer</h1>

          {step === 1 && (
            <Step1
              data={profile}
              onChange={updateProfile}
              onBack={() => navigate(backTo, { state: location.state })}
              onNext={() => goToStep(2)}
            />
          )}

          {step === 2 && (
            <Step2
              data={profile}
              onChange={updateProfile}
              onBack={() => goToStep(1)}    // "Back" on step 2 returns to step 1
              onSubmit={handleSubmitAll}
            />
          )}
          {/* Global submit error */}
          {submitError && (
            <p className="register-form__submit-error" role="alert">
              {submitError}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}