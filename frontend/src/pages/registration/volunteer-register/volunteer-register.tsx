import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "../../../firebase/config";
import { mergePendingSignup } from "../../../firebase/pending-signup";
import { createVolunteer } from "../../../services/VolunteerService";
import { createAvailability, slotKeyToAvailability } from "../../../services/AvailabilityService";

import { updateUser } from "../../../services/UserService";
import Navbar from "../../../components/navbar/global-navbar";
import Step1 from "./volunteer-steps/step1";
import Step2 from "./volunteer-steps/step2";
import "./volunteer-register.css";

export interface VolunteerProfileData {
  categories: string[];
  supportMode: "Physical" | "Virtual";
  skills: string[];
  availability: string[];
}

type Flow = "signup" | "upgrade";

interface FlowConfig {
  backTo: string;       // where step 1's "Previous Page" goes
  successTo: string;
}

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

export default function VolunteerRegisterPage({
  flow = "signup",
}: VolunteerRegisterPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [submitError, setSubmitError] = useState("");

  const { backTo, successTo } = FLOWS[flow];

  const [profile, setProfile] = useState<VolunteerProfileData>({
    categories: [],
    supportMode: "Virtual",
    skills: [],
    availability: [],
  });

  const goToStep = (n: number) =>
    setParams({ step: String(n) }, { state: location.state });

  const handleSubmitAll = async () => {
    if (flow === "upgrade") {
      // User is already signed in — write directly
      const uid = auth.currentUser?.uid;
      if (!uid) {
        console.error("No authenticated user for upgrade flow");
        return;
      }

      try {
        // 1. Mark the user as a volunteer
        await updateUser(uid, { isVolunteer: true });

        // 2. Write the volunteer doc
        await createVolunteer(uid, {
          volCategories: profile.categories,
          prefSupportMode: profile.supportMode,
          skills: profile.skills,
          avgRating: 0,
        });

        // 3. Write each availability slot
        for (const slot of profile.availability) {
          await createAvailability(slotKeyToAvailability(slot, uid));
        }

        navigate(successTo, { replace: true });
      } catch (err) {
        console.error("Volunteer upgrade failed:", err);
        // TODO: show an error to the user
      }
      return;
    }

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

  const updateProfile = (patch: Partial<VolunteerProfileData>) =>
    setProfile((prev) => ({ ...prev, ...patch }));

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
              onBack={() => goToStep(1)}
              onSubmit={handleSubmitAll}
            />
          )}
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