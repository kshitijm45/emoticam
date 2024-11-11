'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  TimeScale,
);

interface EmotionData {
  _id: string;
  meetingId: string;
  participantId: string;
  emotion: string;
  attention: string;
  timestamp: string;
}

const Dashboard = () => {
  const { id: callId } = useParams();
  const [groupedData, setGroupedData] = useState<{
    [key: string]: EmotionData[];
  }>({});
  const [summaries, setSummaries] = useState<{
    [key: string]: {
      emotionSummary: { [key: string]: number };
      attentionSummary: { attentive: number; distracted: number };
      attentionTimeline: { time: string; attention: string }[];
    };
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      if (callId) {
        try {
          const response = await fetch(
            `http://127.0.0.1:4545/api/calls/${callId}`,
          );
          const data: EmotionData[] = await response.json();
          groupDataByParticipant(data);
        } catch (error) {
          console.error('Error fetching emotion data:', error);
        }
      }
    };
    fetchData();
  }, [callId]);

  // Group data by participantId
  const groupDataByParticipant = (data: EmotionData[]) => {
    const grouped = data.reduce(
      (acc, entry) => {
        if (!acc[entry.participantId]) {
          acc[entry.participantId] = [];
        }
        acc[entry.participantId].push(entry);
        return acc;
      },
      {} as { [key: string]: EmotionData[] },
    );

    setGroupedData(grouped);
    calculateSummaries(grouped);
  };

  // Calculate emotion, attention summaries, and attention timeline for each participant
  const calculateSummaries = (grouped: { [key: string]: EmotionData[] }) => {
    const summaries = Object.fromEntries(
      Object.entries(grouped).map(([participantId, data]) => {
        const emotionCounts: { [key: string]: number } = {};
        let attentiveCount = 0;
        let distractedCount = 0;
        const attentionTimeline = data.map((entry) => ({
          time: entry.timestamp,
          attention: entry.attention,
        }));

        data.forEach((entry) => {
          // Count each emotion occurrence
          emotionCounts[entry.emotion] =
            (emotionCounts[entry.emotion] || 0) + 1;

          // Count attention states
          if (entry.attention === 'Attentive') {
            attentiveCount++;
          } else {
            distractedCount++;
          }
        });

        // Calculate percentages
        const totalEntries = data.length;
        const emotionSummary = Object.fromEntries(
          Object.entries(emotionCounts).map(([emotion, count]) => [
            emotion,
            (count / totalEntries) * 100,
          ]),
        );

        const attentionSummary = {
          attentive: (attentiveCount / totalEntries) * 100,
          distracted: (distractedCount / totalEntries) * 100,
        };

        return [
          participantId,
          { emotionSummary, attentionSummary, attentionTimeline },
        ];
      }),
    );

    setSummaries(summaries);
  };

  return (
    <div className="dashboard-container text-white p-5">
      <h1 className="text-2xl font-bold mb-4">
        Dashboard for Call ID: {callId}
      </h1>

      {Object.entries(summaries).map(
        ([
          participantId,
          { emotionSummary, attentionSummary, attentionTimeline },
        ]) => (
          <div key={participantId} className="participant-section mb-8">
            <h2 className="text-xl font-semibold mb-2">
              Participant: {participantId}
            </h2>

            {/* Emotion Summary Pie Chart */}
            <div className="chart-section mb-4">
              <h3 className="text-lg font-semibold mb-2">
                Emotion Distribution
              </h3>
              <div className="w-100 h-100 mx-auto">
                <Pie
                  data={{
                    labels: Object.keys(emotionSummary),
                    datasets: [
                      {
                        data: Object.values(emotionSummary),
                        backgroundColor: [
                          '#FF6384',
                          '#36A2EB',
                          '#FFCE56',
                          '#4BC0C0',
                          '#9966FF',
                        ],
                      },
                    ],
                  }}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>

            {/* Attention Summary Bar Chart */}
            <div className="chart-section mb-4">
              <h3 className="text-lg font-semibold mb-2">
                Attention Distribution
              </h3>
              <div className="w-full max-w-md mx-auto">
                <Bar
                  data={{
                    labels: ['Attentive', 'Distracted'],
                    datasets: [
                      {
                        label: 'Attention Percentage',
                        data: [
                          attentionSummary.attentive,
                          attentionSummary.distracted,
                        ],
                        backgroundColor: ['#36A2EB', '#FF6384'],
                      },
                    ],
                  }}
                  options={{
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: (value) => `${value}%`,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Attention Over Time Line Chart */}
            <div className="chart-section mb-4">
              <h3 className="text-lg font-semibold mb-2">
                Attention Over Time
              </h3>
              <div className="w-full max-w-md mx-auto">
                <Line
                  data={{
                    labels: attentionTimeline.map((entry) => entry.time),
                    datasets: [
                      {
                        label: 'Attention State',
                        data: attentionTimeline.map((entry) =>
                          entry.attention === 'Attentive' ? 1 : 0,
                        ),
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        fill: true,
                        pointBackgroundColor: '#36A2EB',
                        pointRadius: 3,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        ticks: {
                          callback: (value) =>
                            value === 1 ? 'Attentive' : 'Distracted',
                        },
                        beginAtZero: true,
                        max: 1,
                      },
                      x: {
                        type: 'time', // Set type to 'time' for time-based x-axis
                        time: {
                          unit: 'minute', // Customize the time unit as needed
                          tooltipFormat: 'HH:mm:ss',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        ),
      )}
    </div>
  );
};

export default Dashboard;
