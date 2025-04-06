import React, { useState, useEffect } from 'react';

import { Navigate, useNavigate } from 'react-router-dom';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CreditCard, DollarSign, Package, Users, TrendingUp, Menu, User } from "lucide-react";

import { auth } from '../firebase';

import { Sidebar } from './Sidebar';

import { gapi } from 'gapi-script';

import { generateContent } from '../services/geminiService';



const Dashboard = () => {

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [fitnessData, setFitnessData] = useState({

    steps: 0,

    caloriesBurned: 0,

    weight: 0,

  });

  const [overviewData, setOverviewData] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState(null);

  const [aiSuggestions, setAiSuggestions] = useState('');

  const [isGeminiLoading, setIsGeminiLoading] = useState(false);

  

  const user = auth.currentUser;

  const navigate = useNavigate();



  // Google Fit API Configuration

  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

  const SCOPES = [

    'https://www.googleapis.com/auth/fitness.activity.read',

    'https://www.googleapis.com/auth/fitness.body.read',

    'https://www.googleapis.com/auth/fitness.nutrition.read'

  ];



  // Initialize Google API client

  useEffect(() => {

    const initClient = async () => {

      try {

        await gapi.client.init({

          apiKey: API_KEY,

          clientId: CLIENT_ID,

          scope: SCOPES.join(' ')

        });

        

        // Check if user is already signed in to Google

        if (gapi.auth2.getAuthInstance().isSignedIn.get()) {

          fetchFitnessData();

        } else {

          setIsLoading(false);

        }

      } catch (error) {

        console.error('Error initializing Google API client:', error);

        setError('Failed to connect to Google Fit');

        setIsLoading(false);

      }

    };



    const loadGoogleAPI = () => {

      gapi.load('client:auth2', initClient);

    };



    if (user) {

      loadGoogleAPI();

    }

  }, [user]);



  const handleGoogleSignIn = async () => {

    try {

      await gapi.auth2.getAuthInstance().signIn();

      fetchFitnessData();

    } catch (error) {

      console.error('Error signing in with Google:', error);

      setError('Failed to sign in with Google');

    }

  };



  const fetchFitnessData = async () => {

    setIsLoading(true);

    try {

      // Define time period (last 7 days)

      const now = new Date();

      const endTime = now.getTime();

      const startTime = endTime - (7 * 24 * 60 * 60 * 1000); // 7 days ago

  

      // Initialize data containers

      let stepsData = null;

      let caloriesBurnedData = null;


      let weightData = null;

      let requestErrors = [];

  

      // Fetch step count

      try {

        const stepsResponse = await gapi.client.request({

          path: 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',

          method: 'POST',

          body: {

            aggregateBy: [{

              dataTypeName: 'com.google.step_count.delta',

            }],

            bucketByTime: { durationMillis: 86400000 }, // Daily buckets

            startTimeMillis: startTime,

            endTimeMillis: endTime

          }

        });

        stepsData = stepsResponse.result;

      } catch (error) {

        console.error('Failed to fetch steps data:', error);

        requestErrors.push('steps');

      }

  

      // Fetch calories burned

      try {

        const caloriesBurnedResponse = await gapi.client.request({

          path: 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',

          method: 'POST',

          body: {

            aggregateBy: [{

              dataTypeName: 'com.google.calories.expended',

            }],

            bucketByTime: { durationMillis: 86400000 },

            startTimeMillis: startTime,

            endTimeMillis: endTime

          }

        });

        caloriesBurnedData = caloriesBurnedResponse.result;

      } catch (error) {

        console.error('Failed to fetch calories burned data:', error);

        requestErrors.push('calories burned');

      }


  

      // Fetch weight

      try {

        const weightResponse = await gapi.client.request({

          path: 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',

          method: 'POST',

          body: {

            aggregateBy: [{

              dataTypeName: 'com.google.weight',

            }],

            bucketByTime: { durationMillis: 86400000 },

            startTimeMillis: startTime,

            endTimeMillis: endTime

          }

        });

        weightData = weightResponse.result;

      } catch (error) {

        console.error('Failed to fetch weight data:', error);

        requestErrors.push('weight');

      }

  

      // Process steps data

      let totalSteps = 0;

      let stepsBuckets = [];

      if (stepsData) {

        stepsBuckets = stepsData.bucket || [];

        totalSteps = stepsBuckets.reduce((total, bucket) => {

          const points = bucket.dataset[0].point || [];

          return total + points.reduce((sum, point) => {

            return sum + (point.value[0].intVal || 0);

          }, 0);

        }, 0);

      }

  

      // Process calories burned data

      let totalCaloriesBurned = 0;

      let caloriesBurnedBuckets = [];

      if (caloriesBurnedData) {

        caloriesBurnedBuckets = caloriesBurnedData.bucket || [];

        totalCaloriesBurned = caloriesBurnedBuckets.reduce((total, bucket) => {

          const points = bucket.dataset[0].point || [];

          return total + points.reduce((sum, point) => {

            return sum + (point.value[0].fpVal || 0);

          }, 0);

        }, 0);

      }

  
  

      // Process weight data (get latest weight)

      let currentWeight = 0;

      if (weightData) {

        let latestWeightTime = 0;

        

        const weightBuckets = weightData.bucket || [];

        weightBuckets.forEach(bucket => {

          const points = bucket.dataset[0].point || [];

          points.forEach(point => {

            const weightTime = parseInt(point.startTimeNanos || '0', 10);

            if (weightTime > latestWeightTime) {

              latestWeightTime = weightTime;

              currentWeight = point.value[0].fpVal || 0;

            }

          });

        });

      }

  

      // Create daily overview data for chart based on available data

      const overviewChartData = [];

      

      // Use steps data as the basis for dates if available

      if (stepsBuckets.length > 0) {

        stepsBuckets.forEach((bucket, index) => {

          const date = new Date(parseInt(bucket.startTimeMillis, 10));

          const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;

          

          const stepsPoints = bucket.dataset[0].point || [];

          const dailySteps = stepsPoints.reduce((sum, point) => {

            return sum + (point.value[0].intVal || 0);

          }, 0);

  

          let dailyCaloriesBurned = 0;

          if (caloriesBurnedBuckets[index]) {

            const caloriesBurnedPoints = caloriesBurnedBuckets[index].dataset[0].point || [];

            dailyCaloriesBurned = caloriesBurnedPoints.reduce((sum, point) => {

              return sum + (point.value[0].fpVal || 0);

            }, 0);

          }

          

          overviewChartData.push({

            name: formattedDate,

            steps: dailySteps,

            calories: Math.round(dailyCaloriesBurned)

          });

        });

      } else if (caloriesBurnedBuckets.length > 0) {

        // Use calories data if steps not available

        caloriesBurnedBuckets.forEach((bucket) => {

          const date = new Date(parseInt(bucket.startTimeMillis, 10));

          const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;

          

          const caloriesBurnedPoints = bucket.dataset[0].point || [];

          const dailyCaloriesBurned = caloriesBurnedPoints.reduce((sum, point) => {

            return sum + (point.value[0].fpVal || 0);

          }, 0);

          

          overviewChartData.push({

            name: formattedDate,

            steps: 0,

            calories: Math.round(dailyCaloriesBurned)

          });

        });

      }

  

      // Display warning if some data couldn't be fetched

      if (requestErrors.length > 0) {

        // Filter out expected missing data from displaying as errors

        const criticalErrors = requestErrors.filter(err => err !== 'calories consumed');

        

        if (criticalErrors.length > 0) {

          setError(`Note: Some data couldn't be retrieved (${criticalErrors.join(', ')}). Showing available data.`);

        } else {

          // Clear error state if only non-critical data is missing

          setError(null);

        }

      } else {

        setError(null);

      }

  

      // Update state with fitness data

      setFitnessData({

        steps: totalSteps,

        caloriesBurned: Math.round(totalCaloriesBurned),

        weight: currentWeight.toFixed(1)

      });

      

      setOverviewData(overviewChartData);

      setIsLoading(false);

    } catch (error) {

      console.error('Error fetching fitness data:', error);

      setError('Failed to fetch fitness data. Please try again.');

      setIsLoading(false);

    }

  };

  const getAiSuggestions = async () => {

    setIsGeminiLoading(true);

    try {

      // Create a detailed prompt using the fitness data

      const prompt = `

        As a fitness coach, analyze this athlete's data from the past 7 days and provide personalized recommendations:

        

        Steps total: ${fitnessData.steps}

        Average daily steps: ${Math.round(fitnessData.steps / 7)}

        Calories burned total: ${fitnessData.caloriesBurned}

        Average daily calories burned: ${Math.round(fitnessData.caloriesBurned / 7)}


        ${fitnessData.weight > 0 ? `Current weight: ${fitnessData.weight} KG` : 'No weight data available'}

        

        Daily activity breakdown:

        ${overviewData.map(day => `${day.name}: ${day.steps} steps, ${day.calories} calories`).join('\n')}

        

        Please provide:

        1. A brief analysis of their current activity level

        2. Three specific, actionable recommendations to improve fitness

        3. A realistic goal for the next week


      `;

      

      // Get suggestions from Gemini

      const suggestions = await generateContent(prompt);

      setAiSuggestions(suggestions);

    } catch (error) {

      console.error('Failed to get AI suggestions:', error);

      setError((prevError) => prevError 

        ? `${prevError}. Also failed to get AI suggestions.` 

        : 'Failed to get AI suggestions.');

    } finally {

      setIsGeminiLoading(false);

    }

  };

  useEffect(() => {

    if (!isLoading && fitnessData.steps > 0) {

      getAiSuggestions();

    }

  }, [fitnessData.steps, isLoading]);

  const handleSignOut = async () => {

    try {

      // Sign out from Google if signed in

      if (gapi.auth2?.getAuthInstance().isSignedIn.get()) {

        await gapi.auth2.getAuthInstance().signOut();

      }

      // Sign out from Firebase

      await auth.signOut();

      navigate('/login');

    } catch (error) {

      console.error('Error signing out:', error);

    }

  };



  const handleProfileClick = () => {

    navigate('/profile');

  };



  if (!user) {

    return <Navigate to="/login" />;

  }



  return (

    <div className="flex min-h-screen bg-slate-900">

      <Sidebar collapsed={sidebarCollapsed} />

      

      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-[70px]' : 'md:ml-[240px]'}`}>

        <div className="flex-1 space-y-4 p-8">

          {/* Header with Menu Toggle */}

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-4">

              <button 

                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}

                className="p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700"

              >

                <Menu className="h-6 w-6" />

              </button>

              <h2 className="text-3xl font-bold tracking-tight text-white">Fitness Dashboard</h2>

            </div>

            <div className="flex items-center gap-4">

              {!gapi.auth2?.getAuthInstance()?.isSignedIn.get() && (

                <button

                  onClick={handleGoogleSignIn}

                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"

                >

                  Connect Google Fit

                </button>

              )}

              <button

                onClick={handleProfileClick}

                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"

              >

                <User className="h-5 w-5 mr-2 inline-block" /> Profile

              </button>

              <button

                onClick={handleSignOut}

                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"

              >

                Sign Out

              </button>

            </div>

          </div>



          {/* Error Message */}

          {error && (

            <div className="p-4 bg-red-500/20 text-red-500 rounded-lg">

              {error}

            </div>

          )}



          {/* Loading Indicator */}

          {isLoading && (

            <div className="text-center p-8">

              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>

              <p className="mt-4 text-white">Loading fitness data...</p>

            </div>

          )}



          {!isLoading && !error && (

            <>

              {/* Stats Cards */}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-lg bg-slate-800 p-6">

                  <div className="flex items-center space-x-2">

                    <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500">

                      <Package className="h-6 w-6" />

                    </div>

                    <h3 className="text-sm font-medium text-white">Total Steps</h3>

                  </div>

                  <div className="mt-4">

                    <div className="text-3xl font-bold text-white">{fitnessData.steps.toLocaleString()}</div>

                    <div className="mt-2 flex items-center space-x-2">

                      <span className="flex items-center px-2 py-1 text-sm text-blue-500 bg-blue-500/20 rounded-full">

                        <TrendingUp className="h-4 w-4 mr-1" />

                        Past 7 Days

                      </span>

                    </div>

                  </div>

                </div>



                <div className="rounded-lg bg-slate-800 p-6">

                  <div className="flex items-center space-x-2">

                    <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500">

                      <DollarSign className="h-6 w-6" />

                    </div>

                    <h3 className="text-sm font-medium text-white">Calories Burned</h3>

                  </div>

                  <div className="mt-4">

                    <div className="text-3xl font-bold text-white">{fitnessData.caloriesBurned.toLocaleString()}</div>

                    <div className="mt-2 flex items-center space-x-2">

                      <span className="flex items-center px-2 py-1 text-sm text-blue-500 bg-blue-500/20 rounded-full">

                        <TrendingUp className="h-4 w-4 mr-1" />

                        Past 7 Days

                      </span>

                    </div>

                  </div>

                </div>



                
                  


                <div className="rounded-lg bg-slate-800 p-6">

                  <div className="flex items-center space-x-2">

                    <div className="rounded-lg bg-blue-500/20 p-2 text-blue-500">

                      <CreditCard className="h-6 w-6" />

                    </div>

                    <h3 className="text-sm font-medium text-white">Current Weight</h3>

                  </div>

                  <div className="mt-4">

                    <div className="text-3xl font-bold text-white">{fitnessData.weight} KG</div>

                    <div className="mt-2 flex items-center space-x-2">

                      <span className="flex items-center px-2 py-1 text-sm text-blue-500 bg-blue-500/20 rounded-full">

                        <TrendingUp className="h-4 w-4 mr-1" />

                        Latest

                      </span>

                    </div>

                  </div>

                </div>

              </div>



              {/* Charts Section */}

              <div className="grid gap-4 md:grid-cols-7">

                <div className="col-span-4 rounded-lg bg-slate-800 p-6">

                  <h3 className="text-lg font-medium text-white mb-4">Activity Overview</h3>

                  <div className="h-[300px]">

                    <ResponsiveContainer width="100%" height="100%">

                      <AreaChart data={overviewData}>

                        <defs>

                          <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">

                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />

                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />

                          </linearGradient>

                          <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">

                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />

                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />

                          </linearGradient>

                        </defs>

                        <XAxis 

                          dataKey="name" 

                          stroke="#94a3b8"

                          tickLine={false}

                        />

                        <YAxis 

                          stroke="#94a3b8"

                          tickLine={false}

                          yAxisId="left"

                        />

                        <YAxis 

                          stroke="#94a3b8"

                          tickLine={false}

                          orientation="right"

                          yAxisId="right"

                        />

                        <Tooltip 

                          contentStyle={{ background: '#1e293b', border: 'none' }}

                          labelStyle={{ color: '#94a3b8' }}

                        />

                        <Area

                          yAxisId="left"

                          type="monotone"

                          dataKey="steps"

                          stroke="#3b82f6"

                          fillOpacity={1}

                          fill="url(#colorSteps)"

                          name="Steps"

                        />

                        <Area

                          yAxisId="right"

                          type="monotone"

                          dataKey="calories"

                          stroke="#22c55e"

                          fillOpacity={1}

                          fill="url(#colorCalories)"

                          name="Calories"

                        />

                      </AreaChart>

                    </ResponsiveContainer>

                  </div>

                </div>



                <div className="col-span-3 rounded-lg bg-slate-800 p-6">

                  <h3 className="text-lg font-medium text-white mb-4">Activity Summary</h3>

                  <div className="space-y-6">

                    <div className="bg-slate-700 p-4 rounded-lg">

                      <h4 className="text-white font-medium">Daily Average</h4>

                      <div className="mt-2 grid grid-cols-2 gap-4">

                        <div>

                          <p className="text-sm text-slate-400">Steps</p>

                          <p className="text-xl font-bold text-white">

                            {Math.round(fitnessData.steps / 7).toLocaleString()}

                          </p>

                        </div>

                        <div>

                          <p className="text-sm text-slate-400">Calories Burned</p>

                          <p className="text-xl font-bold text-white">

                            {Math.round(fitnessData.caloriesBurned / 7).toLocaleString()}

                          </p>

                        </div>

                      </div>

                    </div>

                    

         


                    {/* AI Coach Section */}

<div className="mt-4 rounded-lg bg-slate-800 p-6">

  <div className="flex items-center justify-between mb-4">

    <h3 className="text-lg font-medium text-white">AI Fitness Coach</h3>

    <button 

      onClick={getAiSuggestions} 

      disabled={isGeminiLoading || isLoading}

      className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 disabled:opacity-50"

    >

      Refresh

    </button>

  </div>

  

  {isGeminiLoading ? (

    <div className="flex justify-center py-8">

      <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>

    </div>

  ) : aiSuggestions ? (

    <div className="bg-slate-700 p-4 rounded-lg">

      <div className="text-white whitespace-pre-line">

        {aiSuggestions}

      </div>

    </div>

  ) : (

    <div className="bg-slate-700 p-4 rounded-lg">

      <p className="text-slate-400">Connect your fitness account to get personalized AI recommendations.</p>

    </div>

  )}

</div>

                    <div className="bg-slate-700 p-4 rounded-lg">

                      <h4 className="text-white font-medium">Current Goal Status</h4>

                      <div className="mt-2">

                        <div className="w-full bg-slate-600 rounded-full h-2.5">

                          <div 

                            className="bg-blue-500 h-2.5 rounded-full" 

                            style={{ width: `${Math.min(100, (fitnessData.steps / 10000) * 100)}%` }}

                          ></div>

                        </div>

                        <p className="mt-2 text-sm text-slate-400">

                          {fitnessData.steps.toLocaleString()} / 10,000 daily steps goal

                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </>

          )}

        </div>

      </main>

    </div>

  );

};



export default Dashboard;