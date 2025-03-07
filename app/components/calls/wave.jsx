// "use client";
// import { useEffect, useRef, useState } from "react";
// import { FaPlay } from "react-icons/fa";
// import { FaPause } from "react-icons/fa6";
// import { RiForward10Fill, RiReplay10Fill } from "react-icons/ri";

// export default function Player({ 
//   url, 
//   wavesurfer, 
//   transcriptRef, 
//   timestamps, 
//   redactedTimestamps = [],
//   showRedactions = true 
// }) {
//   const audioRef = useRef(null);
//   const [playing, setPlaying] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [duration, setDuration] = useState(0);
//   const [currentTime, setCurrentTime] = useState(0);

//   // Initialize wavesurfer ref with our custom implementation
//   useEffect(() => {
//     // Make sure we have a valid audio element before setting up
//     if (!audioRef.current) return;
    
//     const setupWavesurfer = () => {
//       // Create a simple API compatible with how the component uses wavesurfer
//       wavesurfer.current = {
//         isPlaying: () => audioRef.current ? !audioRef.current.paused : false,
//         getCurrentTime: () => audioRef.current ? audioRef.current.currentTime : 0,
//         getDuration: () => audioRef.current ? (audioRef.current.duration || 0) : 0,
//         setTime: (time) => { 
//           if (audioRef.current) audioRef.current.currentTime = time;
//         },
//         playPause: () => { 
//           if (!audioRef.current) return;
          
//           if (audioRef.current.paused) {
//             audioRef.current.play().catch(e => console.error("Error playing audio:", e));
//           } else {
//             audioRef.current.pause();
//           }
//         },
//         skip: (seconds) => {
//           if (audioRef.current) audioRef.current.currentTime += seconds;
//         },
//         setShowRedactions: (value) => {
//           // Custom method to handle redaction toggling
//         }
//       };
//     };
    
//     // Setup with a small delay to ensure the audio element is fully initialized
//     const timer = setTimeout(setupWavesurfer, 100);
    
//     return () => {
//       clearTimeout(timer);
//       wavesurfer.current = null;
//     };
//   }, []);

//   // Audio event handlers
//   useEffect(() => {
//     if (!audioRef.current) return;

//     const handleTimeUpdate = () => {
//       // Add defensive checks to prevent null reference errors
//       if (!audioRef.current) return;
      
//       const currentTime = audioRef.current.currentTime;
//       const duration = audioRef.current.duration || 0;
//       setCurrentTime(currentTime * 1000); // Convert to ms
//       setProgress((currentTime / duration) * 100);

//       // Handle segment highlighting
//       const currentTimeMs = currentTime * 1000;
      
//       // For debugging: log the current time in ms
//       console.log("Current time (ms):", currentTimeMs);
      
//       // Also log redacted timestamps for debugging
//       if (redactedTimestamps.length > 0) {
//         console.log("Redacted timestamps:", redactedTimestamps.slice(0, 2));
//       }
      
//       const currentSegment = timestamps.find(
//         stamp => currentTimeMs >= stamp.start && currentTimeMs <= stamp.end
//       );

//       if (currentSegment) {
//         const element = transcriptRef.current?.querySelector(
//           `#stamp-${CSS.escape(currentSegment.start)}`
//         );
        
//         if (element) {
//           // Smooth scrolling
//           element.scrollIntoView({ behavior: "smooth", block: "nearest" });
          
//           // Handle highlight
//           const otherBubbles = element?.parentElement?.children;
//           if (otherBubbles) {
//             Array.from(otherBubbles).forEach(function (elem) {
//               elem.firstElementChild?.classList.remove("highlight");
//             });
//             element?.firstElementChild?.classList.add("highlight");
//           }
//         }
//       }

//       // Handle audio redaction with better logging and manual implementation
//       if (showRedactions && audioRef.current && redactedTimestamps.length > 0) {
//         // Check if current time is within a redacted section
//         const isRedacted = redactedTimestamps.some(timestamp => {
//           const result = currentTimeMs >= timestamp.start && currentTimeMs <= timestamp.end;
//           if (result) {
//             console.log("Muting audio at", currentTimeMs, "for timestamp", timestamp);
//           }
//           return result;
//         });
        
//         // Mute audio during redacted sections
//         if (isRedacted) {
//           console.log("MUTING AUDIO");
//           audioRef.current.volume = 0; // Use volume instead of muted property
//         } else {
//           audioRef.current.volume = 1;
//         }
//       } else if (audioRef.current) {
//         // Make sure audio is not muted when redactions are off
//         audioRef.current.volume = 1;
//       }
//     };

//     const handlePlay = () => setPlaying(true);
//     const handlePause = () => setPlaying(false);
//     const handleEnded = () => setPlaying(false);
//     const handleLoadedMetadata = () => {
//       setDuration(audioRef.current.duration);
//     };

//     // Add event listeners
//     audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
//     audioRef.current.addEventListener('play', handlePlay);
//     audioRef.current.addEventListener('pause', handlePause);
//     audioRef.current.addEventListener('ended', handleEnded);
//     audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);

//     return () => {
//       if (audioRef.current) {
//         audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
//         audioRef.current.removeEventListener('play', handlePlay);
//         audioRef.current.removeEventListener('pause', handlePause);
//         audioRef.current.removeEventListener('ended', handleEnded);
//         audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
//       }
//     };
//   }, [audioRef.current, timestamps, redactedTimestamps, showRedactions]);

//   // Handle Play/Pause
//   const handlePlayPause = () => {
//     if (audioRef.current) {
//       if (audioRef.current.paused) {
//         audioRef.current.play().catch(e => console.error("Error playing audio:", e));
//       } else {
//         audioRef.current.pause();
//       }
//     }
//   };

//   // Handle Forward
//   const handleForward = () => {
//     if (audioRef.current) {
//       audioRef.current.currentTime += 10;
//     }
//   };

//   // Handle Rewind
//   const handleRewind = () => {
//     if (audioRef.current) {
//       audioRef.current.currentTime -= 10;
//     }
//   };

//   return (
//     <div className="pt-0">
//       {/* Audio player (hidden, but functional) */}
//       <audio
//         ref={audioRef}
//         src={url}
//         preload="metadata"
//         style={{ display: 'none' }}
//       />
      
//       {/* Custom waveform display */}
//       <div className="bg-[#999C9F] rounded-md h-24 w-full relative overflow-hidden">
//         {/* Progress bar */}
//         <div 
//           className="absolute top-0 left-0 bottom-0 bg-[#fc5f1e]" 
//           style={{ width: `${progress}%` }}
//         ></div>
        
//         {/* Center line to simulate cursor */}
//         <div className="absolute top-0 bottom-0 w-0.5 bg-[#fc5f1e] left-1/2 transform -translate-x-1/2"></div>
//       </div>
      
//       {/* Controls */}
//       <div className="flex justify-center items-center mt-4 space-x-6">
//         <button 
//           onClick={handleRewind}
//           className="p-2 hover:bg-vela-background-card rounded-full"
//           aria-label="Rewind 10 seconds"
//         >
//           <RiReplay10Fill size={24} />
//         </button>
//         <button 
//           onClick={handlePlayPause}
//           className="p-3 hover:bg-vela-background-card rounded-full"
//           aria-label={playing ? "Pause" : "Play"}
//         >
//           {playing ? <FaPause size={24} /> : <FaPlay size={24} />}
//         </button>
//         <button 
//           onClick={handleForward}
//           className="p-2 hover:bg-vela-background-card rounded-full"
//           aria-label="Forward 10 seconds"
//         >
//           <RiForward10Fill size={24} />
//         </button>
//       </div>
//     </div>
//   );
// }



"use client";
import { useEffect, useRef, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";
import { RiForward10Fill, RiReplay10Fill } from "react-icons/ri";

export default function Player({ 
  url, 
  wavesurfer, 
  transcriptRef, 
  timestamps, 
  redactedTimestamps = [],
  showRedactions = true 
}) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // For monitoring redaction status
  const [isMuted, setIsMuted] = useState(false);

  // Log redacted timestamps on mount for debugging
  useEffect(() => {
    console.log("Redacted timestamps:", redactedTimestamps);
  }, [redactedTimestamps]);

  // Log redaction state changes
  useEffect(() => {
    console.log("Redaction state changed:", showRedactions ? "enabled" : "disabled");
  }, [showRedactions]);

  // Setup a direct interval to check audio position and apply muting
  useEffect(() => {
    if (!audioRef.current) return;

    let interval;
    
    // Start monitoring when playing
    if (playing) {
      interval = setInterval(() => {
        if (!audioRef.current) return;
        
        const currentMs = audioRef.current.currentTime * 1000;
        
        // Check if we're in a redacted section
        if (showRedactions) {
          const shouldMute = redactedTimestamps.some(
            section => currentMs >= section.start && currentMs <= section.end
          );
          
          // Only log when mute state changes
          if (shouldMute !== isMuted) {
            console.log(`Mute state changed to: ${shouldMute} at ${currentMs}ms`);
            setIsMuted(shouldMute);
          }
          
          // Apply muting
          audioRef.current.volume = shouldMute ? 0 : 1;
        } else {
          // Ensure volume is on when redactions are disabled
          audioRef.current.volume = 1;
          if (isMuted) {
            setIsMuted(false);
          }
        }
      }, 100); // Check every 100ms for more precision
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [playing, showRedactions, redactedTimestamps, isMuted]);

  // Standard audio event handlers
  useEffect(() => {
    if (!audioRef.current) return;

    // Setup wavesurfer API for compatibility
    wavesurfer.current = {
      isPlaying: () => audioRef.current ? !audioRef.current.paused : false,
      getCurrentTime: () => audioRef.current ? audioRef.current.currentTime : 0,
      getDuration: () => audioRef.current ? audioRef.current.duration || 0 : 0,
      setTime: (time) => { 
        if (audioRef.current) audioRef.current.currentTime = time;
      },
      playPause: () => { 
        if (!audioRef.current) return;
        
        if (audioRef.current.paused) {
          audioRef.current.play().catch(e => console.error("Error playing audio:", e));
        } else {
          audioRef.current.pause();
        }
      },
      skip: (seconds) => {
        if (audioRef.current) audioRef.current.currentTime += seconds;
      }
    };

    const handleTimeUpdate = () => {
      if (!audioRef.current) return;
      
      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration || 1;
      
      setCurrentTime(currentTime * 1000);
      setProgress((currentTime / duration) * 100);
      
      // Handle segment highlighting
      const currentTimeMs = currentTime * 1000;
      const currentSegment = timestamps.find(
        stamp => currentTimeMs >= stamp.start && currentTimeMs <= stamp.end
      );

      if (currentSegment) {
        const element = transcriptRef.current?.querySelector(
          `#stamp-${CSS.escape(currentSegment.start)}`
        );
        
        if (element) {
          // Smooth scrolling
          element.scrollIntoView({ behavior: "smooth", block: "nearest" });
          
          // Handle highlight
          const otherBubbles = element?.parentElement?.children;
          if (otherBubbles) {
            Array.from(otherBubbles).forEach(function (elem) {
              elem.firstElementChild?.classList.remove("highlight");
            });
            element?.firstElementChild?.classList.add("highlight");
          }
        }
      }
    };

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleEnded = () => setPlaying(false);

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('play', handlePlay);
    audioRef.current.addEventListener('pause', handlePause);
    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('play', handlePlay);
        audioRef.current.removeEventListener('pause', handlePause);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (audioRef.current.paused) {
      audioRef.current.play().catch(e => console.error("Error playing audio:", e));
    } else {
      audioRef.current.pause();
    }
  };

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 10;
    }
  };

  const handleForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 10;
    }
  };

  return (
    <div className="pt-0">
      {/* Debug info */}
      <div className="text-xs mb-2 text-gray-500">
        {isMuted && <span className="text-red-500 font-bold">AUDIO MUTED (REDACTED CONTENT)</span>}
      </div>
      
      {/* Audio player (hidden) */}
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        style={{ display: 'none' }}
      />
      
      {/* Custom waveform display */}
      <div className="bg-[#999C9F] rounded-md h-24 w-full relative overflow-hidden">
        {/* Progress indicator */}
        <div 
          className="absolute top-0 left-0 bottom-0 bg-[#fc5f1e]" 
          style={{ width: `${progress}%` }}
        ></div>
        
        {/* Current position indicator */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-[#fc5f1e] left-1/2 transform -translate-x-1/2"></div>
      </div>
      
      {/* Controls */}
      <div className="flex justify-center items-center mt-4 space-x-6">
        <button 
          onClick={handleRewind}
          className="p-2 hover:bg-vela-background-card rounded-full"
        >
          <RiReplay10Fill size={24} />
        </button>
        <button 
          onClick={handlePlayPause}
          className="p-3 bg-vela-orange text-white hover:bg-opacity-90 rounded-full"
        >
          {playing ? <FaPause size={24} /> : <FaPlay size={24} />}
        </button>
        <button 
          onClick={handleForward}
          className="p-2 hover:bg-vela-background-card rounded-full"
        >
          <RiForward10Fill size={24} />
        </button>
      </div>
    </div>
  );
}