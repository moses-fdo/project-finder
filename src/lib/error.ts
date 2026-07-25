// Error handling utilities for consistent error messages across the app
import { NextResponse } from "next/server";

export const HTTP_ERRORS = {
  UNAUTHORIZED: "You must be logged in to perform this action.",
  FORBIDDEN: "You don't have permission to access this resource.",
  INTERNAL_SERVER: "Internal server error. Please try again later.",
  BAD_REQUEST: "Invalid request data.",
  NOT_FOUND: "Resource not found.",
};

export const getUserFriendlyError = (error: unknown, context: string): NextResponse => {
  const message = getErrorMessage(error);
  const userError = message.includes("duplicate key")
    ? "Duplicate entry prevented. Please check existing data."
    : message.includes("Foreign key")
      ? "Cannot delete: this item is referenced elsewhere."
      : message;

  console.error(`[${context}]`, error);
  return NextResponse.json({ error: userError }, { status: 500 });
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  if (typeof error === "object" && error !== null && "error" in error) {
    const err = error as { error: unknown };
    return getErrorMessage(err.error);
  }
  return "Something went wrong.";
};
