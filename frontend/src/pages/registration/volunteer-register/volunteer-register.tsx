import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../../../components/navbar/global-navbar";
import Step1 from "./volunteer-steps/step1";
import "./volunteer-register.css";
import "../user-register/user-register.css";

export interface VolunteerProfileData {
  categories: string[];
  supportMode: string;
  skills: string[];
}

export default function VolunteerRegisterPage() {
  const [params, setParams] = useSearchParams();
  const step = Number(params.get("step") ?? 1);

  const [profile, setProfile] = useState<VolunteerProfileData>({
    categories: [],
    supportMode: "virtual",
    skills: [],
  });

  const goToStep = (n: number) => setParams({ step: String(n) });

  const handleSubmitAll = () => {
    // TODO: send `profile` to your API
    console.log("Submitting volunteer registration:", profile);
  };

  return (
    <div className="ui-page register-page">
      <Navbar />

      <main className="register-main">
        <section className="register-card">
          <h1 className="register-card__title">Register as a Volunteer</h1>

          {step === 1 && (
            <Step1
              data={profile}
              onChange={setProfile}
              onBack={() => history.back()}
              onNext={() => goToStep(2)}
            />
          )}

          {step === 2 && (
            <Step2
              data={profile}
              onChange={setProfile}
              onBack={() => goToStep(1)}
              onSubmit={handleSubmitAll}
            />
          )}
        </section>
      </main>
    </div>
  );
}