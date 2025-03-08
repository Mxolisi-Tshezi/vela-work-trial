

"use client";
import { MdOutlineSearch, MdClose, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useState, useRef, useEffect } from "react";
import { Empty } from "antd";
import moment from "moment-timezone";

import VelaCallInfoCard from "../../../components/calls/infoCard";
import Player from "../../../components/calls/wave";
import VelaBubble from "../../../components/calls/bubble";
import SmartDetector from "../../../components/calls/smart_detector";

// Manual implementation of redaction detection
function generateRedactedTimestamps(segments) {
  if (!segments || !Array.isArray(segments)) {
    return [];
  }
  
  let allTimestamps = [];
  
  segments.forEach(segment => {
    if (!segment.redaction || !segment.words || segment.words.length === 0) {
      return;
    }
    
    // Find all redaction placeholders in the redacted text
    const regex = /<[^>]+>/g;
    const redactedMatches = segment.redaction.match(regex) || [];
    
    if (redactedMatches.length === 0) {
      return; // No redactions in this segment
    }
    
    console.log(`Found redactions in segment at ${segment.start}: ${redactedMatches.join(', ')}`);
    
    // Process each redacted placeholder
    redactedMatches.forEach(placeholder => {
      // Find all occurrences of this placeholder in the text
      const redactedText = segment.redaction;
      let startPos = 0;
      let matchPos;
      
      while ((matchPos = redactedText.indexOf(placeholder, startPos)) !== -1) {
        // Count words up to this position
        const textBeforeMatch = redactedText.substring(0, matchPos);
        const wordsBefore = textBeforeMatch.split(/\s+/).length - 1;
        
        // Create a range of words to include in redaction
        let startWordIndex = Math.max(0, wordsBefore - 1);
        let endWordIndex = Math.min(segment.words.length - 1, wordsBefore + 2);
        
        // Find start and end times
        let startTime = segment.start;
        let endTime = segment.end;
        
        // Try to get more precise timestamps from words array
        if (segment.words[startWordIndex] && segment.words[startWordIndex].start !== undefined) {
          startTime = segment.words[startWordIndex].start * 1000 + segment.start - 200;
        }
        
        if (segment.words[endWordIndex] && segment.words[endWordIndex].end !== undefined) {
          endTime = segment.words[endWordIndex].end * 1000 + segment.start + 200;
        }
        
        // Add to timestamps
        allTimestamps.push({
          text: placeholder,
          start: startTime,
          end: endTime
        });
        
        console.log(`Added redaction timestamp for "${placeholder}": ${startTime}ms - ${endTime}ms`);
        
        // Move past this occurrence
        startPos = matchPos + placeholder.length;
      }
    });
  });
  
  console.log("Total redacted timestamps generated:", allTimestamps.length);
  return allTimestamps;
}

export default function CallInfo({ call, url }) {
  const wavesurfer = useRef(null);
  const transcriptRef = useRef(null);

  const segments = call.segments;

  const [showTranslation, setShowTranslation] = useState(false);
  const [search, setSearch] = useState("");
  const [showRedactions, setShowRedactions] = useState(true);
  const [redactedTimestamps, setRedactedTimestamps] = useState([]);

  // Fetch organization settings to determine which entities to redact
  useEffect(() => {
    if (call && call.segments) {
      console.log("Generating redacted timestamps for segments:", call.segments.length);
      const timestamps = generateRedactedTimestamps(call.segments);
      console.log("Generated redacted timestamps:", timestamps);
      setRedactedTimestamps(timestamps);
    }
  }, [call]);

  // Helper function to get placeholders for organization settings
  const getOrgPlaceholders = (redactionSettings) => {
    const redactable = {
      creditCard: "<CREDIT_CARD>",
      ibanCode: "<IBAN_CODE>",
      person: "<PERSON>",
      location: "<LOCATION>",
      crypto: "<CRYPTO>",
      phoneNumber: "<PHONE_NUMBER>",
      email: "<EMAIL_ADDRESS>",
      nrp: "<NRP>",
      ipAddress: "<IP_ADDRESS>",
      dateTime: "<DATE_TIME>",
      url: "<URL>",
      idNumber: "<ID_NUMBER>",
    };

    const orgEntities = redactionSettings
      ? Object.entries(redactionSettings).filter(([key, value]) => value)
      : [];

    return orgEntities.map(([key, value]) => redactable[key]);
  };

  // Toggle redactions state
  const toggleRedactions = () => {
    setShowRedactions(!showRedactions);
    
    // If wavesurfer reference exists, make sure it's updated immediately
    if (wavesurfer.current) {
      // This will trigger the useEffect in the Player component
      wavesurfer.current.setShowRedactions?.(showRedactions);
    }
  };

  return (
    <>
      <div className="flex pt-3 h-56">
        <div className="pr-5 w-3/5">
          <p className="underline font-semibold title ">audio</p>
          <div className="card floating !py-1.5 !mt-0 !w-full">
            {call.audio_path.substring(0, 5) !== "chat-" ? (
              <Player
                url={url}
                wavesurfer={wavesurfer}
                transcriptRef={transcriptRef}
                timestamps={call.segments.map((segment) => {
                  return { start: segment.start, end: segment.end };
                })}
                redactedTimestamps={redactedTimestamps}
                showRedactions={showRedactions}
              />
            ) : (
              <div className="h-32 flex items-center justify-center">
                <Empty
                  description={"Audio not available"}
                  imageStyle={{
                    height: "50px",
                    paddingTop: "5px",
                    paddingBottom: "5px",
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="w-2/5 flex flex-col">
          <p className="underline font-semibold title ">info</p>
          <VelaCallInfoCard
            id={call.id}
            agent={call.agent}
            time={moment(call.recorded)
              .tz("Africa/Johannesburg")
              .format("DD MMMM YYYY, HH:mm")}
            topic={call.topic}
            duration={call.duration}
            silent={call.silent}
            filename={call.filename}
            direction={call.direction}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 grid-rows-1 gap-6 min-h-0 h-full">
        <div className="flex flex-col w-full h-full max-w-xl">
          <div className="flex justify-between items-center">
            <p className="underline font-semibold title">Transcript</p>
            <button
              onClick={toggleRedactions}
              className="px-3 py-1 text-center border rounded-full focus:outline-none transition-colors duration-300 text-sm tracking-wide flex items-center gap-2 hover:bg-vela-orange hover:text-vela-darkest-blue"
            >
              {showRedactions ? (
                <>
                  <MdVisibility size={18} />
                  <span>Reveal Redacted Entities</span>
                </>
              ) : (
                <>
                  <MdVisibilityOff size={18} />
                  <span>Hide Redacted Entities</span>
                </>
              )}
            </button>
          </div>
          <div className="flex justify-between text-sm">
            <div className="relative flex items-center w-full">
              <input
                type="text"
                placeholder="Search"
                className="custom-search-input inline w-full border-b-2 border-vela-grey py-0.5 pl-1 pr-5 focus:outline-none focus:border-vela-text-color border-t-0 border-l-0 border-r-0"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
              />

              <div
                onClick={() => {
                  setSearch("");
                }}
                className={`inline absolute right-1 text-opacity-50 ${
                  search.length > 0 && "cursor-pointer"
                }`}
              >
                {search.length > 0 ? (
                  <MdClose size={15} />
                ) : (
                  <MdOutlineSearch size={15} />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between w-full space-x-4">
              <div className="flex items-center space-x-2 ml-5">
                <button
                  className={`px-3 py-1 text-center border rounded-full focus:outline-none transition-colors duration-300 text-sm tracking-wide ${
                    !showTranslation
                      ? "bg-vela-orange text-vela-darkest-blue font-medium border-vela-orange"
                      : " border font-medium"
                  }`}
                  onClick={() => setShowTranslation(false)}
                >
                  Original
                </button>
                <button
                  className={`px-3 py-1 text-center border rounded-full focus:outline-none transition-colors duration-300 text-sm tracking-wide ${
                    showTranslation
                      ? "bg-vela-orange text-vela-darkest-blue font-medium border-vela-orange"
                      : " border font-medium"
                  }`}
                  onClick={() => setShowTranslation(true)}
                >
                  English
                </button>
              </div>
            </div>
          </div>
          <div
            ref={transcriptRef}
            className="card !my-0 !mt-1 floating !w-full !h-full overflow-y-scroll max-w-xl"
          >
            {"boolean" === typeof call.supported && call.supported ? (
              (search.length > 0
                ? segments.filter((segment) =>
                    segment.transcription?.toLowerCase()?.includes(search)
                  )
                : segments
              ).map((segment, index) => {
                return (
                  <VelaBubble
                    key={index}
                    speaker={segment.speaker}
                    sentiment={segment.emotion}
                    text={showRedactions ? segment.redaction : segment.transcription}
                    translation={segment.translation}
                    language={segment.language}
                    timestamp={segment.start}
                    showTranslation={showTranslation}
                    words={segment.words}
                    currentTime={wavesurfer.current?.getCurrentTime() * 1000 || 0}
                    segmentStart={segment.start}
                    onClick={() => {
                      wavesurfer.current?.setTime(segment.start / 1000);
                    }}
                  />
                );
              })
            ) : (
              <div className="flex justify-center items-center h-full">
                <Empty description={"Language not supported"} />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col grid-rows-2 grid-flow-col w-full  h-full col-span-2 ">
          <p className="underline font-semibold title">{"smart detector"}</p>

          {
            <div
              className={`flex flex-col floating w-full h-full overflow-y-scroll`}
            >
              <div className="flex flex-1 flex-col overflow-y-scroll">
                <SmartDetector summary={call.summary} />
              </div>
            </div>
          }
        </div>
      </div>
    </>
  );
}