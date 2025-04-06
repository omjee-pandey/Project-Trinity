import React, { useState, useEffect } from 'react';
import { PlusCircle, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { auth } from '../firebase';
import { useTheme } from '../hooks/use-theme';
import { Sidebar } from './Sidebar';

const InjuriesSection = ({ user }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme } = useTheme();
  const [injuries, setInjuries] = useState([]);
  const [newInjury, setNewInjury] = useState({
    type: '',
    severity: 'mild',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!user) {
      console.error("User is not authenticated");
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setInjuries([...injuries, { ...newInjury, id: Date.now(), status: 'pending' }]);
    setNewInjury({
      type: '',
      severity: 'mild',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white">
    {/* Sidebar with fixed width */}
    <div className="w-64">
      <Sidebar />
    </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Fitness Dashboard</h2>

        <div className="grid gap-6">
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-medium text-white">Report New Injury</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Injury Type</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newInjury.type}
                  onChange={(e) => setNewInjury({ ...newInjury, type: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Severity</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newInjury.severity}
                    onChange={(e) => setNewInjury({ ...newInjury, severity: e.target.value })}
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newInjury.date}
                    onChange={(e) => setNewInjury({ ...newInjury, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newInjury.description}
                  onChange={(e) => setNewInjury({ ...newInjury, description: e.target.value })}
                  rows="3"
                  required
                />
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                Report Injury
              </button>
            </form>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-medium text-white">Your Reported Injuries</h3>
            </div>

            {injuries.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No injuries reported yet
              </div>
            ) : (
              <div className="space-y-3">
                {injuries.map((injury) => (
                  <div
                    key={injury.id}
                    className={`p-4 rounded-md border ${
                      injury.severity === 'mild'
                        ? 'border-amber-500/30 bg-amber-500/10'
                        : injury.severity === 'moderate'
                        ? 'border-orange-500/30 bg-orange-500/10'
                        : 'border-red-500/30 bg-red-500/10'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white">{injury.type}</h4>
                        <p className="text-sm text-slate-400">{injury.date}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          injury.severity === 'mild'
                            ? 'bg-amber-500/20 text-amber-500'
                            : injury.severity === 'moderate'
                            ? 'bg-orange-500/20 text-orange-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}
                      >
                        {injury.severity}
                      </span>
                    </div>

                    <p className="mt-2 text-slate-300">{injury.description}</p>

                    <div className="mt-3 flex items-center justify-between">
                      <select
                        className="text-sm bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                        value={injury.status}
                        onChange={(e) => {
                          setInjuries((prev) =>
                            prev.map((inj) =>
                              inj.id === injury.id ? { ...inj, status: e.target.value } : inj
                            )
                          );
                        }}
                      >
                        <option value="pending">Pending Review</option>
                        <option value="in_treatment">In Treatment</option>
                        <option value="recovered">Recovered</option>
                      </select>

                      {injury.status === 'recovered' && (
                        <span className="flex items-center gap-1 text-xs text-emerald-500">
                          <CheckCircle className="h-3 w-3" />
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InjuriesSection;
