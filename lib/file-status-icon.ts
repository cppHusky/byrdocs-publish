import { FilePlus, FileText, FileX } from "lucide-react";
import { FileChange } from "./diff";

export const getStatusConfig = (status: FileChange["status"]) => {
  switch (status) {
    case "created":
      return {
        icon: FilePlus,
        iconColor: "text-green-600 dark:text-green-400",
      };
    case "modified":
      return {
        icon: FileText,
        iconColor: "text-amber-600 dark:text-amber-400",
      };
    case "deleted":
      return {
        icon: FileX,
        iconColor: "text-red-600 dark:text-red-400",
      };
    case "unchanged":
      return {
        icon: FileText,
        iconColor: "text-gray-600 dark:text-gray-400",
      };
    default:
      return {
        icon: FileText,
        iconColor: "text-gray-600 dark:text-gray-400",
      };
  }
};
