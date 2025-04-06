import { useState, useEffect } from "react";
import { Calendar, MapPin, Plus } from "lucide-react";
import { Sidebar } from './Sidebar';
import { auth, db } from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion 
} from 'firebase/firestore';

const StadiumBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({
    venue: "",
    date: "",
    time: "",
    status: "Requested"
  });

  const stadiums = [
    "Central Stadium",
    "Olympic Training Center", 
    "Regional Sports Complex",
    "National Arena",
    "City Sports Ground"
  ];

  // Fetch existing bookings when component mounts
  useEffect(() => {
    const fetchBookings = async () => {
      if (!auth.currentUser) return;

      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setBookings(userData.stadiumBookings || []);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

    fetchBookings();
  }, []);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      alert("Please log in to make a booking");
      return;
    }

    if (newBooking.venue && newBooking.date && newBooking.time) {
      const bookingToAdd = {
        ...newBooking,
        id: Date.now().toString(), // Unique identifier
        userId: auth.currentUser.uid
      };

      try {
        // Reference to the user's document
        const userDocRef = doc(db, 'users', auth.currentUser.uid);

        // Check if the document exists
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // Create the document if it doesn't exist
          await setDoc(userDocRef, {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            stadiumBookings: [bookingToAdd]
          });
        } else {
          // Update the existing document
          await updateDoc(userDocRef, {
            stadiumBookings: arrayUnion(bookingToAdd)
          });
        }

        // Update local state
        setBookings([...bookings, bookingToAdd]);

        // Reset form
        setNewBooking({
          venue: "",
          date: "",
          time: "",
          status: "Requested"
        });
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error saving booking:", error);
        alert("Failed to save booking. Please try again.");
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <div className="w-64">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Stadium Booking</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Booking
          </button>
        </div>

        {/* Booking Guidance Section */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-medium text-white">Book Your Training Venue</h3>
          </div>
          <p className="text-slate-400">
            Schedule and manage your training venue bookings with ease. Select from available stadiums and training facilities.
          </p>
        </div>

        {/* Bookings Section */}
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-medium text-white">Your Bookings</h3>
          </div>
          {bookings.length === 0 ? (
            <p className="text-slate-400 text-center py-4">
              No bookings yet. Create your first stadium booking!
            </p>
          ) : (
            <ul className="space-y-3">
              {bookings.map((booking, index) => (
                <li key={booking.id || index} className="bg-slate-700 p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-white font-semibold">{booking.venue}</span>
                      <div className="text-slate-400 text-sm mt-1">
                        {booking.date} at {booking.time}
                      </div>
                    </div>
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-medium
                      ${booking.status === 'Confirmed' ? 'bg-green-500/20 text-green-400' : 
                        booking.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-blue-500/20 text-blue-400'}
                    `}>
                      {booking.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Booking Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-96">
              <h3 className="text-xl font-bold mb-4">New Stadium Booking</h3>
              <form onSubmit={handleBookingSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Select Stadium
                  </label>
                  <select
                    value={newBooking.venue}
                    onChange={(e) => setNewBooking({...newBooking, venue: e.target.value})}
                    className="w-full bg-slate-700 text-white p-2 rounded-md"
                    required
                  >
                    <option value="">Choose a Stadium</option>
                    {stadiums.map((stadium, index) => (
                      <option key={index} value={stadium}>{stadium}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newBooking.date}
                    onChange={(e) => setNewBooking({...newBooking, date: e.target.value})}
                    className="w-full bg-slate-700 text-white p-2 rounded-md"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={newBooking.time}
                    onChange={(e) => setNewBooking({...newBooking, time: e.target.value})}
                    className="w-full bg-slate-700 text-white p-2 rounded-md"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Book Stadium
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StadiumBooking;