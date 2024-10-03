import { ProChat } from "@ant-design/pro-chat";
import { axiosApiInstance } from "../libs/axios-api-Instance";

export default function AskLiv() {
  const handleRequest = async (messages: any[]) => {
    const latestMessage = messages[messages.length - 1];
    try {
      const response = await axiosApiInstance.post("/ai/ask", {
        question: latestMessage.content,
      });

      if (response.data && response.data.data) {
        return {
          content: new Response(response.data.data.answer),
          success: true,
        };
      }
    } catch (error) {
      console.error("Error sending message:", error);
      return {
        content: new Response(
          "Sorry, there was an error processing your request."
        ),
        success: false,
      };
    }
  };

  return (
    <ProChat
      style={{ height: "100%" }}
      request={handleRequest}
      locale="en-US"
      helloMessage="Hello! I am Liv, I can answer any question you might have about this project?"
      placeholder="Type your question here..."
    />
  );
}
