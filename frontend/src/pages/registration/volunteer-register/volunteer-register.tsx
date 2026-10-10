import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../../components/navbar/global-navbar";
import Step1 from "./volunteer-steps/step1";
import Step2 from "./volunteer-steps/step2";
import "./volunteer-register.css";

export interface VolunteerProfileData {
  categories: string[];
  supportMode: string;
  skills: string[];
  availability: string[];
}

type Flow = "signup" | "upgrade";

interface FlowConfig {
  backTo: string;       // where step 1's "Previous Page" goes
  successTo: string;    // where submit goes
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

  const { backTo, successTo } = FLOWS[flow];

  const [profile, setProfile] = useState<VolunteerProfileData>({
    categories: [],
    supportMode: "virtual",
    skills: [],
    availability: [],
  });

  const goToStep = (n: number) =>
    setParams({ step: String(n) }, { state: location.state });

  const handleSubmitAll = () => {
    // TODO: send profile to your API
    console.log("Submitting volunteer registration:", profile);
    navigate(successTo, {
      state: { ...(location.state as object | null), volunteerProfile: profile },
    });
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
        </section>
      </main>
    </div>
  );
}