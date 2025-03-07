"use client";
import {
  PiSmileySadLight,
  PiSmileyLight,
  PiSmileyMehLight,
} from "react-icons/pi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BiSolidInfoCircle } from "react-icons/bi";
import { AiOutlineClose } from "react-icons/ai";
import { useRef, useState, useEffect } from "react";
import { toTimeString } from "../../../lib/formatting";
import moment from "moment";

export default function VelaBubble({
  text,
  translation,
  speaker,
  sentiment,
  language,
  timestamp,
  showTranslation,
  words,
  currentTime,
  segmentStart,
  onClick,
}) {
  const [showDetails, setShowDetails] = useState(false);
  const speechRef = useRef(null);
  
  const colours = {
    negative: "bg-vela-red",
    neutral: "bg-vela-yellow",
    positive: "bg-vela-green",
  };

  const icons = {
    negative: <PiSmileySadLight size={12} />,
    neutral: <PiSmileyMehLight size={12} />,
    positive: <PiSmileyLight size={12} />,
  };

  let textToShow;
  if (!["en-za", "english"].includes(language?.toLowerCase())) {
    textToShow = showTranslation ? (translation ? translation : text) : text;
  } else {
    textToShow = text;
  }

  // Function to highlight the current word being spoken
  useEffect(() => {
    if (!words || !segmentStart || !currentTime) return;
    
    // Calculate the current position in the segment
    const timeInSegment = currentTime - segmentStart;
    
    if (timeInSegment < 0) return;
    
    // Find the word that should be highlighted based on timestamp
    const currentWordElement = words.find(
      word => word.start && word.end && 
      timeInSegment >= word.start * 1000 && 
      timeInSegment <= word.end * 1000
    );

    if (speechRef.current && currentWordElement) {
      // Remove previous highlights
      const highlightedWords = speechRef.current.getElementsByClassName('word-highlight');
      Array.from(highlightedWords).forEach(el => {
        el.classList.remove('word-highlight');
      });
      
      // Add highlight to current word
      const wordElements = speechRef.current.getElementsByClassName('speech-word');
      const wordIndex = words.findIndex(w => w === currentWordElement);
      
      if (wordIndex >= 0 && wordIndex < wordElements.length) {
        wordElements[wordIndex].classList.add('word-highlight');
      }
    }
  }, [currentTime, words, segmentStart]);

  // Function to render text with word spans for highlighting
  const renderTextWithWordSpans = () => {
    if (!words || words.length === 0) {
      return <p className="!py-0.5 !px-2 !m-0 !text-sm">{textToShow}</p>;
    }

    // Create a version of the text split into words
    // This is complex because we need to match the words array with the actual displayed text
    // which might be redacted or translated
    
    // Simple implementation - split by spaces
    const textWords = textToShow.split(/\s+/).filter(w => w.length > 0);
    
    return (
      <p className="!py-0.5 !px-2 !m-0 !text-sm" ref={speechRef}>
        {textWords.map((word, index) => (
          <span 
            key={index} 
            className="speech-word mr-1"
            data-timestamp={words[index]?.start}
          >
            {word}
          </span>
        ))}
      </p>
    );
  };

  return textToShow.trim() !== "" ? (
    <div
      id={`stamp-${timestamp}`}
      className="flex !overflow-x-visible text-sm"
    >
      <div
        className={`${
          speaker === "agent" || speaker === "bot" ? "agent" : "customer"
        } relative my-4 !overflow-x-visible`}
        onClick={onClick}
      >
        <p className="title text-vela-text-color absolute -top-5 text-xs">
          {speaker}
        </p>
        <p className="absolute text-vela-text-color -top-5 right-1 text-xs">
          {timestamp instanceof Date
            ? moment(timestamp).format("DD/MM/YYYY, HH:mm")
            : toTimeString(timestamp)}
        </p>
        {renderTextWithWordSpans()}
        <div
          className={`absolute -bottom-2 ${
            speaker === "agent" ? "left-1.5" : "right-2"
          } text-black font-bold rounded-full floating max-w-fit p-0.5 ${
            colours[sentiment]
          }`}
        >
          {icons[sentiment]}
        </div>
      </div>
    </div>
  ) : (
    <></>
  );
}