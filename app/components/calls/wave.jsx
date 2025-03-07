"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaPlay } from "react-icons/fa";
import { FaPause } from "react-icons/fa6";
import { RiForward10Fill, RiReplay10Fill } from "react-icons/ri";
import { toTimeString } from "../../../lib/formatting";

const formWaveSurferOptions = (ref) => ({
  container: ref,
  waveColor: "#999C9F",
  progressColor: "#fc5f1e",
  cursorColor: "OrangeRed",
  barWidth: 3,
  barRadius: 3,
  responsive: true,
  height: 105,
  normalize: true,
  partialRender: true,
  hideScrollbar: false,
  fillParent: true,
  mediaControls: true,
  xhr: {
    cache: "default",
    mode: "cors",
    method: "GET",
    credentials: "include",
    headers: [
      { key: "cache-control", value: "no-cache" },
      { key: "pragma", value: "no-cache" },
    ],
  },
});

export default function Player({
  url,
  wavesurfer,
  transcriptRef,
  timestamps,
  redactedTimestamps = [],
  showRedactions = true
}) {
  let created = false;
  const waveformRef = useRef(null);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0.0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    console.log(waveformRef?.current);
    if (url && waveformRef?.current && !wavesurfer.current && !created) {
      console.log("creating");
      create();
      created = true;
    }

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        created = false;
      }
    };
  }, []);

  // Handle muting for redacted timestamps
  useEffect(() => {
    if (!wavesurfer.current || !redactedTimestamps || !gainNodeRef.current) return;

    const handleAudioProcess = () => {
      if (!wavesurfer.current || !wavesurfer.current.isPlaying()) return;

      const currentTimeMs = wavesurfer.current.getCurrentTime() * 1000;
      setCurrentTime(currentTimeMs);

      // Check if the current time falls within any redacted timestamp
      if (showRedactions) {
        const shouldMute = redactedTimestamps.some(
          timestamp => currentTimeMs >= timestamp.start && currentTimeMs <= timestamp.end
        );

        // Set gain to 0 (muted) if in redacted section, otherwise set to 1 (normal volume)
        gainNodeRef.current.gain.value = shouldMute ? 0 : 1;
      } else {
        // Always unmuted when redactions are hidden
        gainNodeRef.current.gain.value = 1;
      }
    };

    // Add audio process event listener
    wavesurfer.current.on('audioprocess', handleAudioProcess);

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.un('audioprocess', handleAudioProcess);
      }
    };
  }, [wavesurfer.current, redactedTimestamps, showRedactions]);

  const create = async () => {
    const WaveSurfer = (await import("wavesurfer.js")).default;

    const options = formWaveSurferOptions(waveformRef.current);
    wavesurfer.current = WaveSurfer.create(options);

    wavesurfer.current.load(url);

    wavesurfer.current.on("ready", function () {
      // Set up audio context and gain node for redaction
      audioContextRef.current = wavesurfer.current.getBackend().ac;
      gainNodeRef.current = audioContextRef.current.createGain();

      // Connect wavesurfer source to our gain node, then to destination
      wavesurfer.current.getBackend().setFilters([gainNodeRef.current]);

      setProgress(
        (wavesurfer.current.getCurrentTime() /
          wavesurfer.current.getDuration()) *
        100
      );
    });

    wavesurfer.current.on("audioprocess", function () {
      if (wavesurfer.current.isPlaying()) {
        let wavTimestamp = wavesurfer.current.getCurrentTime();
        setProgress((wavTimestamp / wavesurfer.current.getDuration()) * 100);
        setCurrentTime(wavTimestamp * 1000);

        let currentTimestamp = timestamps.filter(
          (stamp) =>
            wavTimestamp * 1000 >= stamp.start &&
            wavTimestamp * 1000 <= stamp.end
        );

        if (currentTimestamp.length > 0) {
          let element = transcriptRef.current?.querySelector(
            `#stamp-${CSS.escape(currentTimestamp[0].start)}`
          );
          if (element) {
            // Use smooth scrolling for better user experience
            element?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            let otherBubbles = element?.parentElement?.children;
            [...otherBubbles].forEach(function (elem) {
              elem.firstElementChild?.classList.remove("highlight");
            });

            element?.firstElementChild?.classList.add("highlight");
          }
        }

        if (progress >= 100.0) {
          setPlaying(false);
          let otherBubbles = transcriptRef.current?.querySelector(
            `#stamp-${CSS.escape(timestamps[0].start)}`
          )?.parentElement?.children;
          if (otherBubbles) {
            [...otherBubbles].forEach(function (elem) {
              elem.firstElementChild?.classList.remove("highlight");
            });
          }
        }
      }
    });

    wavesurfer.current.on("finish", function () {
      setPlaying(false);
    });

    wavesurfer.current.on("timeupdate", function () {
      setProgress(
        (wavesurfer.current.getCurrentTime() /
          wavesurfer.current.getDuration()) *
        100
      );
    });

    // Handle play/pause to update state
    wavesurfer.current.on("play", function () {
      setPlaying(true);
    });

    wavesurfer.current.on("pause", function () {
      setPlaying(false);
    });
  };

  const handlePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  const handleForward = () => {
    if (wavesurfer.current) {
      wavesurfer.current.skip(10);
    }
  };

  const handleRewind = () => {
    if (wavesurfer.current) {
      wavesurfer.current.skip(-10);
    }
  };

  return (
    <div className="pt-0">
      <div id="waveform" ref={waveformRef} />
      <div className="flex justify-center items-center mt-2 space-x-4">
        <button
          onClick={handleRewind}
          className="p-2 hover:bg-vela-background-card rounded-full"
        >
          <RiReplay10Fill size={24} />
        </button>
        <button
          onClick={handlePlayPause}
          className="p-2 hover:bg-vela-background-card rounded-full"
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