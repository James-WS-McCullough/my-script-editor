import { characterNote } from "../general/types";
import { saveFileDialog } from "../electron/electronUtils";

type exportScriptProps = {
  title: string;
  contentRef: React.RefObject<HTMLDivElement>;
  notes: string;
  characterNotes: characterNote[];
};

export const exportScript = async ({
  title,
  contentRef,
  notes,
  characterNotes,
}: exportScriptProps) => {
  const contentDiv = contentRef.current;
  let scriptText = "";

  // Add character notes that aren't 'EMPTY'
  let charNotes = "";
  characterNotes.forEach((note) => {
    if (note.notes !== "EMPTY") {
      charNotes += `[${note.name}]:\n ${note.notes}\n`;
    }
  });

  if (charNotes !== "") {
    scriptText += `---Character Notes---\n\n${charNotes}\n`;
  }

  // Add notes
  if (notes !== "") {
    scriptText += `\n---Notes---\n ${notes}\n`;
  }

  const traverseNode = (node: Node) => {
    if (node.nodeType === 3) {
      // Text node
      scriptText += node.textContent;
    } else if (node.nodeType === 1) {
      // HTML element
      const element = node as HTMLElement;

      // If it's inside a p tag, traverse the children
      if (element.tagName === "P") {
        Array.from(element.childNodes).forEach(traverseNode);
      } else if (element.tagName === "SPAN") {
        if (element.className === "character-name") {
          scriptText += `\n\t[${element.textContent}]`;
        } else {
          // Check for sub elements
          Array.from(element.childNodes).forEach(traverseNode);
        }
      } else if (element.tagName === "DIV") {
        // Recurse into the div to check its children
        Array.from(element.childNodes).forEach(traverseNode);
        // Add a newline after exiting each div to separate lines
        scriptText += "\n";
      } else if (element.tagName === "BR") {
        // Add a newline when a br tag is encountered
        scriptText += "\n";
      } else if (element.tagName === "I") {
        // Add italics markup
        scriptText += `[i]${element.textContent}[/i]`;
      } else if (element.tagName === "B") {
        // Add bold markup
        scriptText += `[b]${element.textContent}[/b]`;
      } else if (element.tagName === "U") {
        scriptText += `[u]${element.textContent}[/u]`;
      } else {
        // Fallback: recurse into children for any unrecognized element
        // (e.g. FONT, STRONG, EM, MARK, A, etc. that contentEditable may create)
        Array.from(element.childNodes).forEach(traverseNode);
      }
    }
  };

  if (contentDiv) {
    Array.from(contentDiv.childNodes).forEach(traverseNode);
  }

  // Use Electron file dialog or browser download
  await saveFileDialog(scriptText, title + ".txt");
};
