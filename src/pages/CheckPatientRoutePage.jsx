import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { decryptId } from "../utils/encryption";
import {
    getOrdersByPatientId,
    getPatientById,
} from "../utils/checkPatientRoute";
import "../styles/CheckPatientRoutePage.css";

export default function CheckPatientRoutePage() {
    const { id } = useParams();
    const [orders, setOrders] = useState([]);
    const [info, setInfo] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const patientId = decryptId(decodeURIComponent(id));
                const { data, error } = await getOrdersByPatientId(patientId);
                if (error) {
                    alert("Error fetching orders");
                    setLoading(false);
                    return;
                }
                setOrders(data);
                setLoading(false);
            } catch (err) {
                alert("Invalid patient ID");
                setLoading(false);
                navigate("/checkRoute");
            }
        };

        const getPInfo = async () => {
            try {
                const patientId = decryptId(decodeURIComponent(id));
                const { data, error } = await getPatientById(patientId);
                if (error) {
                    alert("Error fetching patient info");
                    setLoading(false);
                    return;
                }
                setInfo(data);
            } catch (error) {
                alert("Invalid patient ID");
                setLoading(false);
                navigate("/checkRoute");
            }
        };

        fetchOrders();
        getPInfo();
    }, [id, navigate]);

    if (loading)
        return (
            <div className="checkPatientRoutePage-loading">
                Loading orders...
            </div>
        );
    return (
        <div className="checkPatientRoutePage">
            {/* Basic Patient Info */}
            <h2>Patient Info</h2>

            <div className="patient-info">
                <p>
                    <strong>Name:</strong> {info.name}
                </p>
                <p>
                    <strong>Age:</strong> {info.age}
                </p>
                <p>
                    <strong>Sex:</strong> {info.sex}
                </p>
                <p>
                    <strong>NRIC:</strong> {info.nric?.slice(0, 6) + "****"}
                </p>{" "}
                {/* mask last 4 digits */}
            </div>

            {/* Orders */}
            <div className="orders-list">
                {orders.length === 0 ? (
                    <div className="no-orders">
                        No orders found for this patient.
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.order_id} className="order-card">
                            <div className="order-header">
                                <span className="order-id">
                                    #{order.order_id}
                                </span>
                                {/* Priority badge can go here if needed */}
                            </div>

                            <div className="order-body">
                                <div className="order-row">
                                    <strong>Department:</strong>{" "}
                                    {order.Department.departmentName}
                                </div>
                                <div className="order-row">
                                    <strong>Location:</strong>{" "}
                                    {order.Department.location}
                                </div>
                                <div className="order-row order-services">
                                    <strong>Services:</strong>
                                    <div className="service-tags">
                                        {order.serviceNameList.map(
                                            (service, idx) => (
                                                <span
                                                    key={idx}
                                                    className="service-tag"
                                                >
                                                    {service.serviceName}
                                                </span>
                                            ),
                                        )}
                                    </div>
                                </div>
                                <div className="order-row">
                                    <strong>Status:</strong>
                                    <span
                                        className={`status status-${order.status?.toLowerCase()}`}
                                    >
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
