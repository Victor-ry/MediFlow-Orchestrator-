import React, { useState } from "react";
import "../styles/CheckRoutePage.css";
import { getPatientByNricAndName } from "../utils/checkPatientRoute";
import { encryptId } from "../utils/encryption";
import { useNavigate } from "react-router-dom";

export default function CheckRoutePage() {
    const [name, setName] = useState("");
    const [ic, setIc] = useState("");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    const handleCheck = async () => {
        setMessage("");

        const { data, error } = await getPatientByNricAndName({
            name: name,
            nric: ic,
        });

        if (error || !data) {
            setMessage(
                "Patient not found. Please check your Full Name and NRIC.",
            );
            return;
        }
        const encryptedId = encryptId(data.patient_id);

        navigate(`/checkRoute/${encodeURIComponent(encryptedId)}`);
    };

    return (
        <div className="check-route-page">
            <div className="container">
                <div className="card">
                    {message && <div className="error-message">{message}</div>}

                    <h2>Check Your Route!</h2>

                    <div className="field">
                        <label>Full Name:</label>
                        <input
                            type="text"
                            value={name}
                            placeholder="Enter your full name"
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="field">
                        <label>NRIC:</label>
                        <input
                            type="text"
                            value={ic}
                            placeholder="YYMMDD-SS-#### (e.g. 900101-14-5678)"
                            onChange={(e) => setIc(e.target.value)}
                        />
                    </div>

                    <button onClick={handleCheck}>Check</button>
                </div>
            </div>
        </div>
    );
}
