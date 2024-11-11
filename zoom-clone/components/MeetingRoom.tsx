import React, { useEffect, useRef, useState } from 'react';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Users, LayoutList } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useUser } from '@clerk/nextjs';
import Loader from './Loader';
import EndCallButton from './EndCallButton';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

const MeetingRoom = () => {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams(); // Use useParams to get meetingId
  const isPersonalRoom = !!searchParams.get('personal');
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [emotionLabel, setEmotionLabel] = useState('');
  const [attentionState, setAttentionState] = useState('Attentive');
  const [trackingEnabled, setTrackingEnabled] = useState(true); // Tracking toggle state
  const [distractionCount, setDistractionCount] = useState(0); // Distraction counter
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);

  // Correctly retrieve meetingId from params
  const meetingId = params.id;

  useEffect(() => {
    console.log('Retrieved meetingId:', meetingId);
  }, [meetingId]);

  const sendFrameToAPI = async (imageData: Blob) => {
    if (!trackingEnabled) return; // Check if tracking is enabled

    const formData = new FormData();
    formData.append('image', imageData, 'frame.jpg');

    try {
      const response = await fetch('http://127.0.0.1:5000/process_frame', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.error) {
        console.error('Error from API:', result.error);
      } else {
        setEmotionLabel(result.emotion);
        setAttentionState(result.attention);
        console.log('Attention:', result.attention);
        // Check if the participant is distracted
        if (result.attention === 'Distracted') {
          setDistractionCount((prevCount) => prevCount + 1);
        } else {
          setDistractionCount(0); // Reset count if attentive
        }

        if (distractionCount >= 4) {
          alert('Participant has been distracted five times in a row.');
          console.log('PAY ATTENTION');
        }

        await saveEmotionData(result.emotion, result.attention);
      }
    } catch (err) {
      console.error('Error sending frame to API:', err);
    }
  };

  const saveEmotionData = async (emotion: string, attention: string) => {
    try {
      const response = await fetch(
        'http://127.0.0.1:4545/api/emotions/saveEmotion',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meetingId, // Uses meetingId from params
            participantId: user?.username || user?.id,
            emotion,
            attention,
          }),
        },
      );
      const result = await response.json();
      console.log('Emotion data saved:', result.message);
    } catch (error) {
      console.error('Failed to save emotion data:', error);
    }
  };

  const processVideoStream = async () => {
    if (hiddenVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = hiddenVideoRef.current.videoWidth;
      canvas.height = hiddenVideoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(hiddenVideoRef.current, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (blob) {
          await sendFrameToAPI(blob);
        }
      }, 'image/jpeg');
    }
  };

  useEffect(() => {
    const getVideoStream = async () => {
      console.log('Meeting ID in useEffect:', meetingId);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (hiddenVideoRef.current) {
          hiddenVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing video stream:', err);
      }
    };
    getVideoStream();
  }, [meetingId]);

  useEffect(() => {
    const interval = setInterval(() => {
      processVideoStream();
    }, 2000);
    return () => clearInterval(interval);
  }, [trackingEnabled]); // Dependency updated to enable/disable tracking

  if (callingState !== CallingState.JOINED) return <Loader />;

  const CallLayout = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      <div className="relative flex size-full items-center justify-center">
        <div className="flex size-full max-w-[1000px] items-center">
          <CallLayout />
        </div>
        <video
          ref={hiddenVideoRef}
          autoPlay
          playsInline
          muted={true}
          className="size-1"
        />
        <div
          className={`h-[calc(100vh-86px)] ${showParticipants ? 'block' : 'hidden'} ml-2`}
        >
          <CallParticipantsList onClose={() => setShowParticipants(false)} />
        </div>
      </div>

      {/* Call controls */}
      <div className="fixed bottom-0 flex w-full items-center justify-center gap-5">
        <CallControls onLeave={() => router.push('/')} />
        <DropdownMenu>
          <div className="flex items-center">
            <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
              <LayoutList size={20} className="text-white" />
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
            {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, index) => (
              <div key={index}>
                <DropdownMenuItem
                  onClick={() =>
                    setLayout(item.toLowerCase() as CallLayoutType)
                  }
                >
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <CallStatsButton />
        <button onClick={() => setShowParticipants((prev) => !prev)}>
          <div className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
            <Users size={20} className="text-white" />
          </div>
        </button>
        {!isPersonalRoom && <EndCallButton />}
      </div>

      {/* Display the emotion and attention detection */}
      <div className="absolute top-4 left-4 p-2 bg-gray-800 text-white rounded-lg">
        <p>Emotion: {emotionLabel}</p>
        <p>Attention: {attentionState}</p>
        <button
          onClick={() => setTrackingEnabled(!trackingEnabled)}
          className="mt-2 p-1 bg-blue-500 text-white rounded"
        >
          {trackingEnabled ? 'Disable Tracking' : 'Enable Tracking'}
        </button>
      </div>
    </section>
  );
};

export default MeetingRoom;
