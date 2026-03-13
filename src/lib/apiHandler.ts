import { AppError } from "./errors";
export function apiHandler(
  handler: (...args: any[]) => Promise<Response>
) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error: any) {
      if (error instanceof AppError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message
          }),
          { status: error.statusCode }
        );
      }

      console.error("Unexpected Error:", error);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Internal Server Error"
        }),
        { status: 500 }
      );
    }
  };
}
