import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Activity } from "lucide-react";
import Sidebar from "../components/Sidebar";
import "../styles/PatientIntakeTranscriptPage.css";

export default function PatientIntakeTranscriptPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const patient = location.state?.patient || {
        patient_id: "P00000",
        name: "Unknown Patient",
        age: "-",
        sex: "-",
        allergies: "-",
        medical_history: "-",
        family_history: "-",
    };
    const consultationTranscript = location.state?.consultation?.transcript || "";
    const [transcript, setTranscript] = useState(consultationTranscript);
    const isTranscriptReady = transcript.trim().length > 0;

    const handleProcessRoute = () => {
        if (!isTranscriptReady) {
            return;
        }

        navigate("/orchestrator/ai-analysis", {
            state: {
                patient,
                transcript: transcript.trim(),
                consultation: location.state?.consultation || null,
            },
        });
    };

    const handleProgressClick = (page) => {
        if (page === "consultation") {
            navigate("/orchestrator/consultation-queue");
        } else if (page === "analysis") {
            // Cannot navigate forward to analysis from transcript
            return;
        }
    };

    const progressSteps = [
        {
            id: "consultation",
            label: "Consultation Queue",
            status: "completed",
        },
        { id: "transcript", label: "Patient Intake", status: "current" },
        { id: "analysis", label: "AI Analysis", status: "upcoming" },
    ];

    return (
        <div className="page-layout">
            <Sidebar />
            <div className="transcript-container">
                <div className="transcript-wrapper">
                    {/* Header */}
                    <div className="transcript-header">
                        <div className="transcript-header-left">
                            <div className="transcript-header-logo">
                                <Activity size={24} color="#475569" />
                                <span>MEDIFLOW</span>
                            </div>
                            <span className="transcript-header-label">
                                ORCHESTRATOR
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="transcript-content">
                        {/* Progress Tracker */}
                        <div className="progress-tracker">
                            {progressSteps.map((step, idx) => (
                                <React.Fragment key={step.id}>
                                    <button
                                        className={`progress-step progress-${step.status}`}
                                        onClick={() =>
                                            handleProgressClick(step.id)
                                        }
                                        disabled={step.status !== "completed"}
                                    >
                                        <span className="progress-number">
                                            {step.status === "completed"
                                                ? "✓"
                                                : idx + 1}
                                        </span>
                                        <span className="progress-label">
                                            {step.label}
                                        </span>
                                    </button>
                                    {idx < progressSteps.length - 1 && (
                                        <div
                                            className={`progress-connector progress-${step.status}`}
                                        ></div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="transcript-titles">
                            <h2 className="transcript-main-title">
                                Patient Intake & Transcript
                            </h2>
                            <p className="transcript-subtitle">
                                Input Clinical Transcript (Write/Voice):
                            </p>
                        </div>

                        {/* Patient Info */}
                        <div className="patient-info-section">
                            <div className="patient-info-item">
                                <span className="patient-info-label">
                                    Patient ID:
                                </span>
                                <span className="patient-info-value">
                                    {patient.patient_id}
                                </span>
                            </div>
                            <div className="patient-info-item">
                                <span className="patient-info-label">
                                    Name:
                                </span>
                                <span className="patient-info-value">
                                    {patient.name}
                                </span>
                            </div>
                            <div className="patient-info-item">
                                <span className="patient-info-label">Age:</span>
                                <span className="patient-info-value">
                                    {patient.age}
                                </span>
                            </div>
                            <div className="patient-info-item">
                                <span className="patient-info-label">Sex:</span>
                                <span className="patient-info-value">
                                    {patient.sex}
                                </span>
                            </div>
                            <div className="patient-info-item">
                                <span className="patient-info-label">
                                    Allergies:
                                </span>
                                <span className="patient-info-value">
                                    {patient.allergies}
                                </span>
                            </div>
                        </div>

                        {/* Transcript Textarea */}
                        <textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            className="transcript-textarea"
                            spellCheck={false}
                            placeholder="Enter the consultation transcript here. Example: Patient complains of red eye for 3 days with blurry vision. Blood pressure slightly elevated."
                        />

                        {/* Process & Route Button */}
                        <div className="transcript-buttons">
                            <button
                                onClick={handleProcessRoute}
                                className={`transcript-btn ${transcript.trim() ? "transcript-btn-active" : ""}`}
                                disabled={!isTranscriptReady}
                            >
                                Process & Route
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
