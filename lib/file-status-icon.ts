import { FilePlus, FileText, FileX } from "lucide-react";
import { FileChange } from "./diff";

export const getStatusConfig = (status: FileChange["status"]) => {
  switch (status) {
    case "created":
      return {
        icon: FilePlus,
        iconColor: "text-green-600 dark:text-green-400",
        borderColor: "border-green-200 dark:border-green-800",
      };
    case "modified":
      return {
        icon: FileText,
        iconColor: "text-amber-600 dark:text-amber-400",
        borderColor: "border-amber-200 dark:border-amber-800",
      };
    case "deleted":
      return {
        icon: FileX,
        iconColor: "text-red-600 dark:text-red-400",
        borderColor: "border-red-200 dark:border-red-800",
      };
    case "unchanged":
      return {
        icon: FileText,
        iconColor: "text-gray-600 dark:text-gray-400",
        borderColor: "border-gray-200 dark:border-gray-800",
      };
    default:
      return {
        icon: FileText,
        iconColor: "text-gray-600 dark:text-gray-400",
        borderColor: "border-gray-200 dark:border-gray-800",
      };
  }
};
