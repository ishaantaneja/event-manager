import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyBookings } from "../store/slices/bookingSlice.js";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { list, loading, error } = useSelector((state) => state.bookings);

  useEffect(() => {
    if (token) dispatch(fetchMyBookings(token));
  }, [dispatch, token]);

  if (loading) return <p className="text-center mt-10">Loading your bookings...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">My Bookings</h1>
      {list.length === 0 && <p>No bookings yet.</p>}
      <ul className="space-y-2">
        {list.map((booking) => (
          <li key={booking._id} className="border p-4 rounded shadow">
            <p className="font-bold">{booking.eventName}</p>
            <p>{booking.date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
