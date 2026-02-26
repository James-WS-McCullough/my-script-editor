import {
  Box,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Text,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
  Textarea,
  IconButton,
  Input,
  Image,
  List,
  ListItem,
  HStack,
  Stack,
} from "@chakra-ui/react";
import DeleteIcon from "@mui/icons-material/Delete";
import MenuIcon from "@mui/icons-material/Menu";
import DownloadIcon from "@mui/icons-material/Download";
import CreateIcon from "@mui/icons-material/Create";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import InfoIcon from "@mui/icons-material/Info";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SettingsIcon from "@mui/icons-material/Settings";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import HistoryIcon from "@mui/icons-material/History";
import EditNoteIcon from "@mui/icons-material/EditNote";
import NoteIcon from "@mui/icons-material/Note";
import Face2Icon from "@mui/icons-material/Face2";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandIcon from "@mui/icons-material/Expand";
import CompressIcon from "@mui/icons-material/Compress";
import FileUploadIcon from "@mui/icons-material/FileUpload";

import { useEffect, useRef, useState } from "react";
import {
  deleteAllScripts,
  deleteScript,
} from "./utils/scriptManagement/deleteScript";
import { newScript } from "./utils/scriptManagement/newScript";
import { searchSavedTitles } from "./utils/scriptManagement/searchSavedTitles";
import { saveScript } from "./utils/scriptManagement/saveScript";
import { importScript } from "./utils/scriptManagement/importScript";
import { exportScript } from "./utils/scriptManagement/exportScript";
import { formatTimestamp } from "./utils/general/formatTimestamp";
import { handleNewScript } from "./handlers/handleNewScript";
import { handleRenameScript } from "./handlers/handleRenameScript";
import { handleOpenRenameModal } from "./handlers/handleOpenRenameModal";
import { handleOpenMenu } from "./handlers/handleOpenMenu";
import { handleKeyDown } from "./handlers/handleKeyDown";
import { handleGenerateText } from "./handlers/handleGenerateText";
import PendingIcon from "@mui/icons-material/Pending";
import { set, throttle } from "lodash";
import { getScriptVersions } from "./utils/scriptManagement/getScriptVersions";
import { formatTimestampExact } from "./utils/general/formatTimestampExact";
import { loadScript } from "./utils/scriptManagement/loadScript";
import { compressImage } from "./utils/database/ImageCompressor";
import { EditDocumentIcon } from "./icons/editDocument";
import { DocumentIcon } from "./icons/DocumentIcon";
import DataArrayIcon from "@mui/icons-material/DataArray";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import ShortTextIcon from "@mui/icons-material/ShortText";
import {
  baseIconColor,
  darkIconColor,
  designColors,
} from "./utils/general/constants";
import { updateCharacterNameStyling } from "./utils/updateCharacterNameStyling";
import { characterNote } from "./utils/general/types";
import { handleSaveEditedName } from "./handlers/handleSaveEditedName";
import { handleAddNewCharacter } from "./handlers/handleAddNewCharacter";
import { populateCharacterNotes } from "./utils/general/populateCharacterNotes";
import { NotesModal } from "./modals/NotesModal";
import { UploadModal } from "./modals/UploadModal";
import { loadScriptFromSpan } from "./utils/scriptManagement/loadScriptFromSpan";
import { SelectScript } from "./components/selectScript";
import { FindReplaceBar } from "./components/FindReplaceBar";
import { SelectScriptModal } from "./modals/selectScriptModal";
import { addLinkSpan } from "./utils/general/createLinkFromSelection";
import { MenuModal } from "./modals/MenuModal";
import SelectOptionModal from "./modals/SelectOptionModal";
import {
  handleOptionSelect,
  typeSlashOptions,
} from "./handlers/handleOptionSelect";
import { ExternalLinkModal } from "./modals/ExternalLinkModal";
import { getSharedScript } from "./utils/supabase/supabaseConnect";
import { LinkIcon } from "./icons/linkIcon";
import { ShareSuccessModal } from "./modals/ShareSuccessModal";
import { scriptSpacingTypes } from "./styling";
import { DeleteScriptModal } from "./modals/DeleteScriptModal";
import { RenameScriptModal } from "./modals/RenameScriptModal";
import { NameNewScriptModal } from "./modals/NameNewScriptModal";
import { TagMenu } from "./modals/TagMenu";
import {
  getSettings,
  saveSettings,
  getRepositoryPath,
  setRepositoryPath,
  selectFolder,
  openRepositoryFolder,
  isElectron
} from "./utils/electron/electronUtils";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

type AppProps = {
  scriptId?: string;
  isReadOnly?: boolean;
};

function App({ scriptId, isReadOnly }: AppProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [importText, setImportText] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [title, setTitle] = useState("");
  const [scriptUUID, setScriptUUID] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [scriptSpacing, setScriptSpacing] = useState(scriptSpacingTypes.SPACED);
  const [iconImage, setIconImage] = useState("");
  const [uploadedIconImage, setUploadedIconImage] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [iconColor, setIconColor] = useState(baseIconColor as string);
  const [editCharacterModalOpen, setEditCharacterModalOpen] = useState(false);
  const [characterToEdit, setCharacterToEdit] = useState<string | null>(null);
  const [newCharacterName, setNewCharacterName] = useState("");
  const [characterNotes, setCharacterNotes] = useState<characterNote[]>([]);
  const [savedRange, setSavedRange] = useState<Range>();
  const [scriptLinkHistory, setScriptLinkHistory] = useState<string[]>([]);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [scriptShareLink, setScriptShareLink] = useState("");
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [scriptTags, setScriptTags] = useState<string[]>([]);
  const [currentInfoNoteText, setCurrentInfoNoteText] = useState<string | null>(
    null
  );
  const [currentInfoNoteSpan, setCurrentInfoNoteSpan] = useState<
    HTMLElement | undefined
  >(undefined);
  const [selectedVersion, setSelectedVersion] = useState<{
    title: string;
    timestamp: number;
    iconImage?: string;
    index: number;
    iconColor: string;
    content: string;
  } | null>(null);
  const {
    isOpen: isUploadModalOpen,
    onOpen: onUploadModalOpen,
    onClose: onUploadModalClose,
  } = useDisclosure();
  const [editorSettings, setEditorSettings] = useState({
    novelAiApiKey: "",
    targetWordCount: 0,
    maxWordCount: 0,
  });
  const [repositoryPath, setRepositoryPathState] = useState<string>("");
  const [wordCount, setWordCount] = useState(0);
  const [scriptVersions, setScriptVersions] = useState([]) as [
    {
      title: string;
      timestamp: number;
      iconImage?: string;
      index: number;
      iconColor: string;
      content: string;
    }[],
    any
  ];
  const {
    isOpen: isMenuOpen,
    onOpen: onMenuOpen,
    onClose: onMenuClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();
  const {
    isOpen: isRenameModalOpen,
    onOpen: onRenameModalOpen,
    onClose: onRenameModalClose,
  } = useDisclosure();
  const {
    isOpen: isNameModalOpen,
    onOpen: onNameModalOpen,
    onClose: onNameModalClose,
  } = useDisclosure();
  const {
    isOpen: isInfoModalOpen,
    onOpen: onInfoModalOpen,
    onClose: onInfoModalClose,
  } = useDisclosure();
  const {
    isOpen: isIconModalOpen,
    onOpen: onIconModalOpen,
    onClose: onIconModalClose,
  } = useDisclosure();
  const {
    isOpen: isSettingsModalOpen,
    onOpen: onSettingsModalOpen,
    onClose: onSettingsModalClose,
  } = useDisclosure();
  const {
    isOpen: isVersionsModalOpen,
    onOpen: onVersionsModalOpen,
    onClose: onVersionsModalClose,
  } = useDisclosure();
  const {
    isOpen: isSelectScriptModalOpen,
    onOpen: onSelectScriptModalOpen,
    onClose: onSelectScriptModalClose,
  } = useDisclosure();
  const {
    isOpen: isSelectOptionModalOpen,
    onOpen: onSelectOptionModalOpen,
    onClose: onSelectOptionModalClose,
  } = useDisclosure();
  const {
    isOpen: isExternalLinkModalOpen,
    onOpen: onExternalLinkModalOpen,
    onClose: onExternalLinkModalClose,
  } = useDisclosure();

  const {
    isOpen: isNotesModalOpen,
    onOpen: onNotesModalOpen,
    onClose: onNotesModalClose,
  } = useDisclosure();

  const {
    isOpen: isTagMenuOpen,
    onOpen: onTagMenuOpen,
    onClose: onTagMenuClose,
  } = useDisclosure();

  // if a script is passed in, load it
  useEffect(() => {
    if (scriptId) {
      getSharedScript(scriptId).then((script) => {
        setTitle(script.title);
        setNotes(script.notes);
        if (script.character_notes) {
          setCharacterNotes(JSON.parse(script.character_notes));
        }
        setScriptLinkHistory([script.title]);
        if (contentRef.current) {
          contentRef.current.innerHTML = script.html;
          updateCharacterNameStyling({ contentRef, scriptSpacing });
        }
      });
    }
  }, []);

  // A function that takes uploaded image, compresses it using compressImage and sets it as the icon
  const handleUploadIcon = async (event: any) => {
    const uploadedImage = event.target.files[0];
    const compressedImage = await compressImage(uploadedImage);
    const reader = new FileReader();
    reader.readAsDataURL(compressedImage);
    reader.onloadend = () => {
      setUploadedIconImage(reader.result as string);
    };
  };

  type handleBackButtonProps = {
    isReadOnly: boolean | undefined;
  };

  const handleBackButton = ({ isReadOnly }: handleBackButtonProps) => {
    if (isReadOnly) {
      window.history.pushState({}, "", "/");
      window.location.reload();
      return;
    }

    if (scriptLinkHistory.length > 1) {
      const currentPage = scriptLinkHistory.pop();
      const lastLink = scriptLinkHistory.pop();
      if (lastLink) {
        setIsLoadingScript(true);
        loadScript({
          loadTitle: lastLink,
          title,
          scriptUUID,
          setScriptUUID,
          contentRef,
          setTitle,
          setNotes,
          notes,
          setIsLoading,
          setIconImage,
          iconImage,
          setIconColor,
          iconColor,
          setCharacterNotes,
          characterNotes,
          versionIndex: -1,
          setScriptLinkHistory,
          scriptSpacing,
          setScriptTags,
          scriptTags,
        }).then(() => {
          setIsLoadingScript(false);
        });
      }
    }
  };

  type handleEditNameProps = {
    name: string;
  };
  const handleEditName = ({ name }: handleEditNameProps) => {
    setCharacterToEdit(name);
    setNewCharacterName(name);
    setEditCharacterModalOpen(true);
  };

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      if (settings) {
        setEditorSettings(settings);
        if (settings.scriptSpacing) {
          setScriptSpacing(settings.scriptSpacing);
        }
      }
      // Load repository path
      if (isElectron()) {
        const repoPath = await getRepositoryPath();
        setRepositoryPathState(repoPath);
      }
    };
    loadSettings();
  }, []);

  // Listen for Cmd+F / Ctrl+F (Find) and Cmd+H / Ctrl+H (Replace)
  useEffect(() => {
    const handleFindReplace = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setIsFindReplaceOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "h") {
        e.preventDefault();
        setIsFindReplaceOpen(true);
        setShowReplace(true);
      }
    };
    window.addEventListener("keydown", handleFindReplace);
    return () => window.removeEventListener("keydown", handleFindReplace);
  }, []);

  // Listen for fullscreen changes (for hiding title bar in fullscreen)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    // Also check on mount
    setIsFullscreen(!!document.fullscreenElement);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      saveScript({
        title,
        scriptUUID,
        contentRef,
        iconImage,
        notes,
        iconColor,
        characterNotes,
        scriptTags,
      });
    }
  }, [
    contentRef.current?.innerHTML,
    contentRef.current?.innerText,
    iconImage,
    notes,
    iconColor,
    characterNotes,
    scriptTags,
  ]);

  const updateWordCount = throttle(() => {
    if (contentRef.current) {
      const text = contentRef.current.innerText; // Split by spaces or line breaks and remove empty elements
      const words = text
        .trim()
        .split(/\s+/)
        .filter((word) => word !== "");
      if (words.length !== wordCount) {
        setWordCount(words.length);
      }
    }
  }, 10000);

  useEffect(() => {
    let currentlyLoadingScript = false;

    const element = contentRef.current;

    if (element) {
      element.addEventListener("input", () => {
        if (isLoadingScript || currentlyLoadingScript) return; // Step 3: Check flag

        updateWordCount();
        saveScript({
          title,
          scriptUUID,
          contentRef,
          iconImage,
          notes,
          iconColor,
          characterNotes,
          scriptTags,
        });
      });

      element.addEventListener("click", (e: MouseEvent) => {
        if (
          (e.target as HTMLElement).classList.contains("script-link") &&
          !isLoadingScript &&
          !currentlyLoadingScript
        ) {
          // prevent default behavior
          e.preventDefault();

          if (isReadOnly) {
            alert("Script links don't work in read only mode!");
            return;
          }

          setIsLoadingScript(true); // Step 2: Set flag before loading
          currentlyLoadingScript = true;

          loadScriptFromSpan({
            span: e.target as HTMLElement,
            title,
            scriptUUID,
            setScriptUUID,
            contentRef,
            setTitle,
            setIconImage,
            iconImage,
            notes,
            setNotes,
            setIsLoading,
            iconColor,
            setIconColor,
            characterNotes,
            setCharacterNotes,
            setScriptLinkHistory,
            scriptSpacing,
            setScriptTags,
            scriptTags,
          }).then(() => {
            setIsLoadingScript(false); // Step 4: Reset flag after loading
            currentlyLoadingScript = false;
          });
        }
        if (
          (e.target as HTMLElement).classList.contains("url-link") &&
          !isLoadingScript &&
          !currentlyLoadingScript
        ) {
          e.preventDefault();
          // get url from span.dataset.linkUrl = url; and open in new tab
          currentlyLoadingScript = true;
          const url = (e.target as HTMLElement).dataset.linkUrl;
          if (url) {
            window.open(url, "_blank");
            const selection = window.getSelection();
            if (selection) {
              selection.removeAllRanges();
            }
          }

          currentlyLoadingScript = false;
        }
        if (
          (e.target as HTMLElement).classList.contains("info-note") &&
          !isLoadingScript &&
          !currentlyLoadingScript
        ) {
          e.preventDefault();
          // get the data-note-id from the span and set it as the current info note
          const note = (e.target as HTMLElement).dataset.note;
          if (note) {
            setCurrentInfoNoteText(note);
            setCurrentInfoNoteSpan(e.target as HTMLElement);
          }
        }
      });

      updateWordCount();
    }

    return () => {
      if (element) {
        element.removeEventListener("input", updateWordCount);
      }
    };
  }, []);

  useEffect(() => {
    document.title = title || "Script Editor"; // Set the title to the script title or some default title
  }, [title]); // This useEffect runs every time `title` changes

  // An icon button that accepts a color prop, and displays a document icon of that color. When clicked, it sets the icon color to that color
  const ColorIconButton = ({ color }: { color: string }) => {
    return (
      <IconButton
        colorScheme="grey"
        aria-label="Update icon"
        icon={<EditDocumentIcon color={color} width="40px" />}
        backgroundColor="blackAlpha.200"
        // on hover, change the icon color to the color of the button
        _hover={{
          backgroundColor: "blackAlpha.600",
          cursor: "pointer",
        }}
        onClick={() => {
          setIconColor(color);
          setIconImage("");
          onIconModalClose();
          onMenuClose();
        }}
      />
    );
  };

  type handleVersionSelectProps = {
    title: string;
    timestamp: number;
    iconImage?: string;
    index: number;
    iconColor: string;
    content: string;
  };

  const handleVersionSelect = (script: handleVersionSelectProps) => {
    setSelectedVersion(script);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100vh"
      backgroundColor="black"
    >
      {/* Electron title bar - draggable area for window controls (hidden in fullscreen) */}
      {isElectron() && !isFullscreen && (
        <Box
          height="38px"
          minHeight="38px"
          backgroundColor={designColors.darkblue}
          width="100%"
          sx={{
            WebkitAppRegion: "drag",
            userSelect: "none",
          }}
        />
      )}
      <Stack
        // Box should fill the entire window and expand to fit the content
        display="flex"
        alignItems="center"
        justifyContent="center"
        backgroundColor="black"
        spacing={0}
        flexDirection={["column-reverse", "row"]}
        flex="1"
        height={isElectron() && !isFullscreen ? "calc(100vh - 38px)" : "100vh"}
      >
        {/* Button Area */}
        <Stack
          id="button-bar"
          spacing={2}
          p="2"
          backgroundColor={designColors.darkblue}
          direction={["row", "column"]}
          width={["100vw", "fit-content"]}
          height={["fit-content", "100%"]}
          alignItems="start"
        >
          {!isReadOnly && (
            <IconButton
              aria-label="Open menu"
              icon={<MenuIcon />}
              onClick={() => {
                handleOpenMenu({
                  onMenuOpen,
                });
              }}
              isDisabled={isGenerating}
              title="Menu"
            />
          )}
        <IconButton
          aria-label="Edit notes"
          icon={<NoteIcon />}
          onClick={() => {
            onNotesModalOpen();
          }}
          colorScheme="blue"
          isDisabled={isGenerating || !title}
          visibility={title ? "visible" : "hidden"}
          title="Edit Notes"
        />
        <IconButton
          aria-label="Edit character notes"
          icon={<Face2Icon />}
          onClick={() => {
            populateCharacterNotes({
              contentRef,
              characterNotes,
              setCharacterNotes,
            });
            setEditCharacterModalOpen(true);
          }}
          colorScheme="blue"
          isDisabled={isGenerating || !title}
          visibility={title ? "visible" : "hidden"}
          title="Edit Character Notes"
        />
        <IconButton
          aria-label="Toggle Spacing"
          visibility={title ? "visible" : "hidden"}
          icon={
            scriptSpacing === scriptSpacingTypes.COMPACT ? (
              <ExpandIcon />
            ) : (
              <CompressIcon />
            )
          }
          onClick={async () => {
            const newSpacing =
              scriptSpacing === scriptSpacingTypes.SPACED
                ? scriptSpacingTypes.COMPACT
                : scriptSpacingTypes.SPACED;
            setScriptSpacing(newSpacing);
            updateCharacterNameStyling({
              contentRef,
              scriptSpacing: newSpacing,
            });
            const settings = await getSettings();
            await saveSettings({ ...settings, scriptSpacing: newSpacing });
          }}
          colorScheme="blue"
          isDisabled={isGenerating}
          title="Toggle Spacing"
        />
        <IconButton
          aria-label="Edit tags"
          icon={<LocalOfferIcon />}
          onClick={() => {
            onTagMenuOpen();
          }}
          colorScheme="blue"
          isDisabled={isGenerating || !title}
          visibility={title ? "visible" : "hidden"}
          title="Edit Tags"
        />

        {editorSettings.novelAiApiKey && (
          <IconButton
            colorScheme="blue"
            aria-label="Generate text"
            icon={isGenerating ? <PendingIcon /> : <CreateIcon />}
            onClick={() => {
              handleGenerateText({
                contentRef,
                setIsGenerating,
                apiToken: editorSettings.novelAiApiKey,
              });
            }}
            isDisabled={isGenerating}
            // Visiblity is hidden if there is no title or if there is no editorSettings.novelAiApiKey
            visibility={
              title && editorSettings.novelAiApiKey ? "visible" : "hidden"
            }
          />
        )}
        {isLoading && <PendingIcon />}
      </Stack>
      <VStack
        spacing={3}
        p={2}
        flex="1"
        alignItems="center"
        justifyContent="center"
        height="100%"
        width="100%"
      >
        {!title && (
          <VStack position="absolute">
            <Text
              color="white"
              fontWeight={600}
              fontSize="38px"
              textAlign="center"
            >
              Welcome to the Script Editor!
            </Text>
            <Text color="white" fontSize="16px" textAlign="center">
              Click the menu button in the top left to select a script or create
              a new one.
            </Text>
            <EditDocumentIcon color={baseIconColor} width="300px" />
          </VStack>
        )}
        <VStack
          maxWidth="1000px"
          width="full"
          alignItems="start"
          height={[
            `calc(100vh - ${
              Math.min(
                document.getElementById("button-bar")?.clientHeight || 0,
                document.getElementById("button-bar")?.clientWidth || 0
              ) + 16
            }px)`,
            "100%",
          ]}
        >
          <HStack id="title-bar" height="40px">
            {title && (
              <HStack marginRight="5px">
                {(scriptLinkHistory.length > 1 || isReadOnly) && (
                  <IconButton
                    aria-label="Back"
                    icon={<ArrowBackIcon />}
                    onClick={() => {
                      handleBackButton({ isReadOnly });
                    }}
                    // no background, green icon, icon goes white on hover
                    backgroundColor="transparent"
                    color="white"
                    _hover={{
                      color: iconColor,
                    }}
                    title="Back"
                  />
                )}
                {iconImage && (
                  <Image src={iconImage} width="40px" borderRadius="4" />
                )}
                {!iconImage && (
                  <EditDocumentIcon color={iconColor} width="40px" />
                )}
              </HStack>
            )}
            <Text
              color="white"
              fontWeight={600}
              fontSize="24px"
              height="40px"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {title}
            </Text>
          </HStack>
          <VStack
            maxWidth="1000px"
            width="100%"
            alignItems="center"
            justifyContent="center"
            flexDirection="row"
            //Define height by parent, subtracting the height of the button area
            height={`calc(100% - ${
              (document.getElementById("title-bar")?.clientHeight || 0) + 8
            }px)`}
            position="relative"
          >
            <FindReplaceBar
              contentRef={contentRef}
              isOpen={isFindReplaceOpen}
              onClose={() => setIsFindReplaceOpen(false)}
              showReplace={showReplace}
              setShowReplace={setShowReplace}
            />
            <div
              contentEditable={!isGenerating && !!title && !isReadOnly}
              placeholder="Type your script here..."
              style={{
                overflowY: "auto", // Enable vertical scrolling
                width: "100%",
                height: "100%",
                backgroundColor: designColors.backgroundgray,
                color: "white",
                padding: "1em",
                borderRadius: "0.25em",
                fontSize: "18px",
              }}
              ref={contentRef}
              onKeyDown={(event) => {
                handleKeyDown(event, {
                  contentRef,
                  setSavedRange,
                  onSelectOptionModalOpen,
                  title,
                  notes,
                  characterNotes,
                  scriptSpacing,
                });
              }}
            ></div>
          </VStack>
        </VStack>
      </VStack>
      {/* Info box in the lower right corner that shows word count, updated live*/}
      <Box
        position="absolute"
        bottom="0"
        right="0"
        width="100px"
        zIndex="100"
        padding="1em"
        pointerEvents="none"
      >
        <Text
          fontWeight={600}
          fontSize="18px"
          textAlign="right"
          color={
            wordCount > editorSettings.maxWordCount
              ? "red"
              : wordCount > editorSettings.targetWordCount
              ? "lightgreen"
              : "white"
          }
        >
          {wordCount}
        </Text>
      </Box>
      <NotesModal
        {...{ isNotesModalOpen, onNotesModalClose, notes, setNotes }}
      />
      <NotesModal
        isNotesModalOpen={currentInfoNoteText !== null}
        onNotesModalClose={() => {
          if (currentInfoNoteSpan && currentInfoNoteText) {
            currentInfoNoteSpan.dataset.note = currentInfoNoteText;
          }
          setCurrentInfoNoteText(null);
          setCurrentInfoNoteSpan(undefined);
        }}
        notes={currentInfoNoteText || ""}
        setNotes={setCurrentInfoNoteText}
      />
      <UploadModal
        {...{
          isUploadModalOpen,
          onUploadModalClose,
          importText,
          setImportText,
          contentRef,
          scriptSpacing,
        }}
      />
      <MenuModal
        isOpen={isMenuOpen}
        onClose={onMenuClose}
        notes={notes}
        setNotes={setNotes}
        onNameModalOpen={onNameModalOpen}
        isGenerating={isGenerating}
        onUploadModalOpen={onUploadModalOpen}
        title={title}
        scriptUUID={scriptUUID}
        setScriptUUID={setScriptUUID}
        contentRef={contentRef}
        characterNotes={characterNotes}
        onRenameModalOpen={onRenameModalOpen}
        onIconModalOpen={onIconModalOpen}
        onDeleteModalOpen={onDeleteModalOpen}
        setScriptVersions={setScriptVersions}
        onVersionsModalOpen={onVersionsModalOpen}
        onInfoModalOpen={onInfoModalOpen}
        onSettingsModalOpen={onSettingsModalOpen}
        setScriptLinkHistory={setScriptLinkHistory}
        setIsLoadingScript={setIsLoadingScript}
        setTitle={setTitle}
        setIsLoading={setIsLoading}
        setIconImage={setIconImage}
        iconImage={iconImage}
        setIconColor={setIconColor}
        iconColor={iconColor}
        setCharacterNotes={setCharacterNotes}
        setScriptShareLink={setScriptShareLink}
        scriptSpacing={scriptSpacing}
        setScriptTags={setScriptTags}
        scriptTags={scriptTags}
      />
      <DeleteScriptModal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        title={title}
        contentRef={contentRef}
        setTitle={setTitle}
      />
      <RenameScriptModal
        isOpen={isRenameModalOpen}
        onClose={onRenameModalClose}
        setTitle={setTitle}
        title={title}
      />
      <NameNewScriptModal
        isOpen={isNameModalOpen}
        onClose={onNameModalClose}
        setTitle={setTitle}
        contentRef={contentRef}
        setNotes={setNotes}
        setIconImage={setIconImage}
        setIconColor={setIconColor}
        setScriptUUID={setScriptUUID}
      />
      <Modal isOpen={isInfoModalOpen} onClose={onInfoModalClose}>
        <ModalOverlay />
        <ModalContent
          backgroundColor={designColors.backgroundgray}
          color="white"
        >
          <ModalHeader>Information</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              This is a simple script editor. All scripts are stored locally on
              your local storage.
            </Text>
            <Text paddingTop="4" fontWeight="bold">
              --- Keyboard Shortcuts ---
            </Text>
            <Text>
              <b>Tab or "["</b> - Begin a new character name. <br />
              <b>Enter</b> - Finish a charcter name, start line. <br />
              <b>"]"</b> - Finish a character name, begin line description.{" "}
              <br />
              <b>")"</b> - Finish a line description, start line. <br />
              <b>"/"</b> - Open action menu. <br />
            </Text>
            <Text paddingTop="4" fontWeight="bold">
              --- Saving ---
            </Text>
            <Text>
              Scripts are only saved if they have at least 10 characters.
            </Text>
          </ModalBody>
          <ModalFooter></ModalFooter>
        </ModalContent>
      </Modal>
      {/* Script icon modal - Upload the icon for the script */}
      <Modal isOpen={isIconModalOpen} onClose={onIconModalClose} size="xl">
        <ModalOverlay />
        <ModalContent
          backgroundColor={designColors.backgroundgray}
          color="white"
        >
          <ModalHeader>Update Script Icon</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Choose a color:</Text>
            <HStack
              spacing="2"
              marginBottom="2"
              flex="1"
              justifyContent="center"
            >
              <ColorIconButton color="#00FFB6" />
              <ColorIconButton color="#00C8FF" />
              <ColorIconButton color="#008DFF" />
              <ColorIconButton color="#FF00F1" />
              <ColorIconButton color="#FF004E" />
              <ColorIconButton color="#FF0000" />
            </HStack>
            <HStack
              spacing="2"
              marginBottom="2"
              flex="1"
              justifyContent="center"
            >
              <ColorIconButton color="#FF8B00" />
              <ColorIconButton color="#FFDC00" />
              <ColorIconButton color="#C7FF00" />
              <ColorIconButton color="#00FF0E" />
              <ColorIconButton color="#FFFFFF" />
              <ColorIconButton color="#939393" />
            </HStack>
            <Text marginTop="5">Or, upload your own icon:</Text>
            <Input
              type="file"
              onChange={(event) => {
                handleUploadIcon(event);
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => {
                setIconImage(uploadedIconImage);
                onIconModalClose();
              }}
            >
              Upload
            </Button>
            <Button onClick={onIconModalClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isSettingsModalOpen} onClose={onSettingsModalClose}>
        <ModalOverlay />
        <ModalContent
          backgroundColor={designColors.backgroundgray}
          color="white"
        >
          <ModalHeader>Editor Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {window.location.hostname === "localhost" && (
              <VStack alignItems="start" spacing="0">
                <Text>NovelAI API Key (only works locally)</Text>
                <Input
                  value={editorSettings.novelAiApiKey}
                  onChange={(e) =>
                    setEditorSettings({
                      ...editorSettings,
                      novelAiApiKey: e.target.value,
                    })
                  }
                />
              </VStack>
            )}
            <Text>Target Word Count</Text>
            <Input
              value={editorSettings.targetWordCount}
              onChange={(e) =>
                setEditorSettings({
                  ...editorSettings,
                  targetWordCount: parseInt(e.target.value),
                })
              }
            />
            <Text>Max Word Count</Text>
            <Input
              value={editorSettings.maxWordCount}
              onChange={(e) =>
                setEditorSettings({
                  ...editorSettings,
                  maxWordCount: parseInt(e.target.value),
                })
              }
            />
            {isElectron() && (
              <VStack alignItems="start" spacing="2" mt="4" width="100%">
                <Text fontWeight="bold">Scripts Repository</Text>
                <Text fontSize="sm" color="gray.400">
                  Where your scripts are saved on disk
                </Text>
                <HStack width="100%" spacing="2">
                  <Input
                    value={repositoryPath}
                    isReadOnly
                    flex="1"
                    fontSize="sm"
                  />
                  <IconButton
                    aria-label="Open folder"
                    icon={<FolderOpenIcon />}
                    onClick={() => openRepositoryFolder(repositoryPath)}
                    title="Open in file explorer"
                  />
                </HStack>
                <HStack spacing="2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      const newPath = await selectFolder();
                      if (newPath) {
                        await setRepositoryPath(newPath);
                        setRepositoryPathState(newPath);
                      }
                    }}
                  >
                    Change Location
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await setRepositoryPath(null);
                      const defaultPath = await getRepositoryPath();
                      setRepositoryPathState(defaultPath);
                    }}
                  >
                    Reset to Default
                  </Button>
                </HStack>
              </VStack>
            )}
            <Button
              aria-label="Delete script"
              colorScheme="red"
              mt="4"
              onClick={() => {
                const confirmation = window.confirm(
                  "Are you sure you want to delete all scripts?"
                );
                if (confirmation) {
                  deleteAllScripts();
                  onSettingsModalClose();
                }
              }}
              isDisabled={isGenerating || !title}
            >
              {" "}
              <DeleteIcon />
              Delete All Scripts
            </Button>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={async () => {
                await saveSettings(editorSettings);
                onSettingsModalClose();
              }}
            >
              Save
            </Button>
            <Button onClick={onSettingsModalClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Versions modal */}
      <Modal isOpen={isVersionsModalOpen} onClose={onVersionsModalClose}>
        <ModalOverlay />
        <ModalContent
          backgroundColor={designColors.backgroundgray}
          color="white"
        >
          <ModalHeader>Versions</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {scriptVersions.length === 0 && <Text>No versions yet!</Text>}
            {scriptVersions.length > 0 && (
              <VStack flex="1" width="100%">
                <List width="100%" spacing="1">
                  {scriptVersions.map((script) => (
                    <ListItem
                      border="1px solid #ccc"
                      borderRadius="0.25em"
                      backgroundColor={designColors.darkblue}
                      padding="0.5em"
                      key={scriptVersions.indexOf(script)}
                      onClick={() => handleVersionSelect(script)}
                      // Hilight the hovered item
                      _hover={{
                        backgroundColor: darkIconColor,
                        cursor: "pointer",
                      }}
                    >
                      <HStack justifyContent="space-between">
                        <HStack>
                          {script?.iconImage && (
                            <Image src={script.iconImage} width="30px" />
                          )}
                          {!script?.iconImage && (
                            <DocumentIcon
                              color={script.iconColor || baseIconColor}
                              width="30px"
                            />
                          )}
                          <Text>
                            Version{" "}
                            {scriptVersions.length -
                              scriptVersions.indexOf(script)}
                          </Text>
                        </HStack>
                        <Text>
                          {formatTimestampExact({
                            timestamp: script.timestamp,
                          })}
                        </Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
      <Modal
        isOpen={!!selectedVersion}
        onClose={() => setSelectedVersion(null)}
        size="4xl"
      >
        <ModalOverlay />
        <ModalContent
          backgroundColor={designColors.backgroundgray}
          color="white"
        >
          <ModalHeader>
            Are you sure you want to restore the following version?
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <div
              style={{
                border: "1px solid #ccc",
                overflowY: "auto", // Enable vertical scrolling
                width: "100%",
                maxHeight: "400px",
                backgroundColor: designColors.backgroundgray,
                color: "white",
                padding: "1em",
                borderRadius: "0.25em",
                fontSize: "18px",
              }}
              dangerouslySetInnerHTML={{
                __html: selectedVersion?.content || "",
              }}
            />
          </ModalBody>
          <ModalFooter>
            <HStack justifyContent="space-between" flex="1">
              // Italics
              <Text color="red" fontStyle="italic">
                This is irriversible, and will overwrite the current version.
              </Text>
              <HStack spacing="1">
                <Button mr={3} onClick={() => setSelectedVersion(null)}>
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={async () => {
                    await loadScript({
                      loadTitle: title,
                      title,
                      scriptUUID,
                      setScriptUUID,
                      contentRef,
                      setTitle,
                      setIconImage,
                      iconImage,
                      versionIndex: selectedVersion?.index,
                      notes,
                      setNotes,
                      setIsLoading,
                      iconColor,
                      setIconColor,
                      characterNotes,
                      setCharacterNotes,
                      setScriptLinkHistory,
                      scriptSpacing,
                      setScriptTags,
                      scriptTags,
                    });
                    setSelectedVersion(null); // Close the confirmation modal
                    onVersionsModalClose(); // Close the versions modal
                  }}
                >
                  Restore
                </Button>
              </HStack>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal
        isOpen={editCharacterModalOpen}
        onClose={() => {
          setEditCharacterModalOpen(false);
        }}
        size="4xl"
      >
        <ModalOverlay />
        <ModalContent
          backgroundColor={designColors.backgroundgray}
          color="white"
        >
          <ModalHeader>Character Notes</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack>
              {characterNotes.map((charNote, index) => (
                <Box key={index} width="100%" marginBottom="4">
                  <HStack justifyContent="start">
                    <IconButton
                      aria-label="Rename character"
                      icon={<DriveFileRenameOutlineIcon />}
                      title="Rename Character"
                      onClick={() => handleEditName({ name: charNote.name })}
                    />
                    {charNote.notes == "EMPTY" && (
                      <IconButton
                        colorScheme="blue"
                        aria-label="Add notes"
                        icon={<EditNoteIcon />}
                        title="Add Notes"
                        onClick={() => {
                          setCharacterNotes((prevNotes) =>
                            prevNotes.map((note, idx) =>
                              idx === index ? { ...note, notes: " " } : note
                            )
                          );
                        }}
                      />
                    )}
                    {charNote.notes != "EMPTY" && (
                      <IconButton
                        colorScheme="red"
                        aria-label="Clear notes"
                        icon={<DeleteIcon />}
                        title="Clear Notes"
                        onClick={() => {
                          setCharacterNotes((prevNotes) =>
                            prevNotes.map((note, idx) =>
                              idx === index ? { ...note, notes: "EMPTY" } : note
                            )
                          );
                        }}
                      />
                    )}

                    <Text fontWeight="bold" fontSize="18px">
                      {charNote.name}
                    </Text>
                  </HStack>

                  {charNote.notes != "EMPTY" && (
                    <Textarea
                      value={charNote.notes}
                      marginTop="2"
                      onChange={(e) =>
                        setCharacterNotes((prevNotes) =>
                          prevNotes.map((note, idx) =>
                            idx === index
                              ? { ...note, notes: e.target.value }
                              : note
                          )
                        )
                      }
                    />
                  )}
                </Box>
              ))}
              <Button
                colorScheme="teal"
                onClick={() => {
                  handleAddNewCharacter({
                    setCharacterNotes,
                    characterNotes,
                  });
                }}
              >
                Add New Character
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
      <Modal
        isOpen={characterToEdit !== null}
        onClose={() => setCharacterToEdit(null)}
      >
        <ModalOverlay />
        <ModalContent
          backgroundColor={designColors.backgroundgray}
          color="white"
          width="fit-content"
        >
          <ModalHeader>Edit Character Name</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="New character name"
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              onClick={() =>
                handleSaveEditedName({
                  newName: newCharacterName,
                  contentRef,
                  setCharacterNotes,
                  setEditCharacterModalOpen,
                  setCharacterToEdit,
                  characterToEdit,
                })
              }
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <SelectOptionModal
        isOpen={isSelectOptionModalOpen}
        onClose={onSelectOptionModalClose}
        options={Object.values(typeSlashOptions)}
        onSelectOption={(option: string) =>
          handleOptionSelect({
            option,
            onSelectScriptModalOpen,
            contentRef,
            setSavedRange,
            savedRange,
            onExternalLinkModalOpen,
            onMenuOpen,
            onNotesModalOpen,
            setEditCharacterModalOpen,
          })
        }
      />
      <SelectScriptModal
        isSelectScriptModalOpen={isSelectScriptModalOpen}
        onSelectScriptModalClose={onSelectScriptModalClose}
        title={title}
        setIsLoading={setIsLoading}
        onSelect={(title) => {
          if (savedRange) {
            addLinkSpan(title, savedRange);
            setSavedRange(undefined);
          }
          onSelectScriptModalClose();
        }}
      />
      <ExternalLinkModal
        isOpen={isExternalLinkModalOpen}
        onClose={onExternalLinkModalClose}
        savedRange={savedRange}
        setSavedRange={setSavedRange}
      />
      <ShareSuccessModal
        scriptShareLink={scriptShareLink}
        setScriptShareLink={setScriptShareLink}
      />
      <TagMenu
        isOpen={isTagMenuOpen}
        onClose={onTagMenuClose}
        scriptTags={scriptTags}
        setScriptTags={setScriptTags}
      />
    </Stack>
    </Box>
  );
}

export default App;
