import { useEffect, useRef, useState, useCallback } from "react";
import {
  HStack,
  Input,
  IconButton,
  Text,
  VStack,
  Box,
} from "@chakra-ui/react";
import CloseIcon from "@mui/icons-material/Close";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import FindReplaceIcon from "@mui/icons-material/FindReplace";
import { designColors } from "../utils/general/constants";

type FindReplaceBarProps = {
  contentRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onClose: () => void;
  showReplace: boolean;
  setShowReplace: (show: boolean) => void;
};

export const FindReplaceBar = ({
  contentRef,
  isOpen,
  onClose,
  showReplace,
  setShowReplace,
}: FindReplaceBarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const highlightsRef = useRef<Range[]>([]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      // Pre-fill with selected text
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setSearchTerm(selection.toString().trim());
      }
    }
  }, [isOpen]);

  // Clear highlights when closing
  useEffect(() => {
    if (!isOpen) {
      clearHighlights();
      setSearchTerm("");
      setReplaceTerm("");
      setMatchCount(0);
      setCurrentMatch(0);
    }
  }, [isOpen]);

  const clearHighlights = useCallback(() => {
    if (!contentRef.current) return;
    const marks = contentRef.current.querySelectorAll("mark[data-find-highlight]");
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
        parent.normalize();
      }
    });
    highlightsRef.current = [];
  }, [contentRef]);

  const findMatches = useCallback(
    (term: string) => {
      clearHighlights();
      if (!term || !contentRef.current) {
        setMatchCount(0);
        setCurrentMatch(0);
        return;
      }

      const treeWalker = document.createTreeWalker(
        contentRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );

      const textNodes: Text[] = [];
      let node: Node | null;
      while ((node = treeWalker.nextNode())) {
        textNodes.push(node as Text);
      }

      const lowerTerm = term.toLowerCase();
      let totalMatches = 0;

      // Process text nodes in reverse to avoid offset issues
      const matchInfos: { node: Text; start: number; end: number }[] = [];
      for (const textNode of textNodes) {
        const text = textNode.textContent || "";
        const lowerText = text.toLowerCase();
        let idx = 0;
        while ((idx = lowerText.indexOf(lowerTerm, idx)) !== -1) {
          matchInfos.push({ node: textNode, start: idx, end: idx + term.length });
          idx += term.length;
          totalMatches++;
        }
      }

      // Apply highlights in reverse order so offsets don't shift
      for (let i = matchInfos.length - 1; i >= 0; i--) {
        const { node: textNode, start, end } = matchInfos[i];
        const range = document.createRange();
        range.setStart(textNode, start);
        range.setEnd(textNode, end);

        const mark = document.createElement("mark");
        mark.setAttribute("data-find-highlight", "true");
        mark.style.backgroundColor = "#FFD700";
        mark.style.color = "black";
        mark.style.borderRadius = "2px";
        range.surroundContents(mark);
      }

      setMatchCount(totalMatches);
      if (totalMatches > 0) {
        setCurrentMatch(1);
        scrollToMatch(0);
      } else {
        setCurrentMatch(0);
      }
    },
    [contentRef, clearHighlights]
  );

  const scrollToMatch = (index: number) => {
    if (!contentRef.current) return;
    const marks = contentRef.current.querySelectorAll("mark[data-find-highlight]");
    marks.forEach((mark, i) => {
      const el = mark as HTMLElement;
      if (i === index) {
        el.style.backgroundColor = "#FF8C00";
        el.style.outline = "2px solid #FF8C00";
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        el.style.backgroundColor = "#FFD700";
        el.style.outline = "none";
      }
    });
  };

  const goToNext = () => {
    if (matchCount === 0) return;
    const next = currentMatch >= matchCount ? 1 : currentMatch + 1;
    setCurrentMatch(next);
    scrollToMatch(next - 1);
  };

  const goToPrev = () => {
    if (matchCount === 0) return;
    const prev = currentMatch <= 1 ? matchCount : currentMatch - 1;
    setCurrentMatch(prev);
    scrollToMatch(prev - 1);
  };

  const replaceCurrent = () => {
    if (matchCount === 0 || !contentRef.current) return;
    const marks = contentRef.current.querySelectorAll("mark[data-find-highlight]");
    const idx = currentMatch - 1;
    if (idx >= 0 && idx < marks.length) {
      const mark = marks[idx];
      const textNode = document.createTextNode(replaceTerm);
      mark.parentNode?.replaceChild(textNode, mark);
      textNode.parentNode?.normalize();
      // Re-run search to update highlights
      findMatches(searchTerm);
    }
  };

  const replaceAll = () => {
    if (matchCount === 0 || !contentRef.current) return;
    const marks = contentRef.current.querySelectorAll("mark[data-find-highlight]");
    // Replace in reverse to preserve order
    for (let i = marks.length - 1; i >= 0; i--) {
      const mark = marks[i];
      const textNode = document.createTextNode(replaceTerm);
      mark.parentNode?.replaceChild(textNode, mark);
      textNode.parentNode?.normalize();
    }
    setMatchCount(0);
    setCurrentMatch(0);
    // Trigger input event so the app saves
    contentRef.current.dispatchEvent(new Event("input", { bubbles: true }));
  };

  // Re-search when term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      findMatches(searchTerm);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, findMatches]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
    if (e.key === "Enter") {
      if (e.shiftKey) {
        goToPrev();
      } else {
        goToNext();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Box
      position="absolute"
      top={0}
      right={0}
      zIndex={200}
      bg={designColors.darkblue}
      borderBottomLeftRadius="8px"
      boxShadow="0 2px 10px rgba(0,0,0,0.5)"
      p="2"
      maxWidth="420px"
    >
      <VStack spacing="1" align="stretch">
        <HStack spacing="1">
          <IconButton
            aria-label="Toggle replace"
            icon={<FindReplaceIcon />}
            size="sm"
            colorScheme={showReplace ? "blue" : "whiteAlpha"}
            onClick={() => setShowReplace(!showReplace)}
            title="Toggle Replace"
          />
          <Input
            ref={searchInputRef}
            placeholder="Find..."
            size="sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            color="white"
            width="200px"
            _placeholder={{ color: "gray.400" }}
          />
          <Text color="gray.400" fontSize="xs" minWidth="50px" textAlign="center">
            {matchCount > 0 ? `${currentMatch}/${matchCount}` : "0/0"}
          </Text>
          <IconButton
            aria-label="Previous match"
            icon={<ArrowUpwardIcon sx={{ fontSize: 16 }} />}
            size="sm"
            colorScheme="whiteAlpha"
            onClick={goToPrev}
            isDisabled={matchCount === 0}
            title="Previous (Shift+Enter)"
          />
          <IconButton
            aria-label="Next match"
            icon={<ArrowDownwardIcon sx={{ fontSize: 16 }} />}
            size="sm"
            colorScheme="whiteAlpha"
            onClick={goToNext}
            isDisabled={matchCount === 0}
            title="Next (Enter)"
          />
          <IconButton
            aria-label="Close"
            icon={<CloseIcon sx={{ fontSize: 16 }} />}
            size="sm"
            colorScheme="whiteAlpha"
            onClick={onClose}
            title="Close (Esc)"
          />
        </HStack>
        {showReplace && (
          <HStack spacing="1">
            {/* Spacer matching the toggle button width */}
            <Box minWidth="32px" />
            <Input
              placeholder="Replace..."
              size="sm"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              color="white"
              width="200px"
              _placeholder={{ color: "gray.400" }}
            />
            {/* Spacer matching the match count text width */}
            <Box minWidth="50px" />
            <IconButton
              aria-label="Replace"
              size="sm"
              colorScheme="whiteAlpha"
              onClick={replaceCurrent}
              isDisabled={matchCount === 0}
              title="Replace"
              icon={
                <Text fontSize="xs" fontWeight="bold" color="white">
                  1
                </Text>
              }
            />
            <IconButton
              aria-label="Replace all"
              size="sm"
              colorScheme="whiteAlpha"
              onClick={replaceAll}
              isDisabled={matchCount === 0}
              title="Replace All"
              icon={
                <Text fontSize="xs" fontWeight="bold" color="white">
                  All
                </Text>
              }
            />
            {/* Spacer matching the close button width */}
            <Box minWidth="32px" />
          </HStack>
        )}
      </VStack>
    </Box>
  );
};
