import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Later: fetch from backend API (placeholder for now)
    setUsers([
      { email: "admin@signapp.com", role: "admin" },
      { email: "user@org.com", role: "user" },
      { email: "recipient@example.com", role: "recipient" },
    ]);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Manage Users</h2>
      <p>View and manage registered users below.</p>
      <table border="1" cellPadding="8" style={{ marginTop: "20px", width: "100%" }}>
        <thead>
          <tr style={{ background: "#f2f2f2" }}>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={i}>
              <td>{u.email}</td>
              <td>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
