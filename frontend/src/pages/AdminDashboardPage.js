import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

export default function AdminDashboardPage() {
  const { token } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({ totalEvents: 0, totalBookings: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, [token]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Admin Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border p-4 rounded shadow">
          <h2 className="font-bold">Total Events</h2>
          <p className="text-2xl">{stats.totalEvents}</p>
        </div>
        <div className="border p-4 rounded shadow">
          <h2 className="font-bold">Total Bookings</h2>
          <p className="text-2xl">{stats.totalBookings}</p>
        </div>
      </div>
    </div>
  );
}
