import { ProChat } from "@ant-design/pro-chat";
import { Flex } from "antd";
import { useEffect, useState } from "react";
import { axiosApiInstance } from "../libs/axios-api-Instance";
import { Loader } from "./common/loader";

export default function AskLiv() {
  const [sessionIdIsLoading, setSessionIdIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [initialChats, setInitialChats] = useState<any[] | undefined>();

  useEffect(() => {
    const fetchSessionId = async () => {
      const storedSessionId = localStorage.getItem("sessionId");

      if (storedSessionId) {
        setSessionId(storedSessionId);
        setSessionIdIsLoading(false);
        return;
      } else {
        try {
          setSessionIdIsLoading(true);
          const response = await axiosApiInstance.post("/ai/create-session");
          if (response.data && response.data.data.sessionId) {
            const newSessionId = response.data.data.sessionId;
            localStorage.setItem("sessionId", newSessionId);
            setSessionId(newSessionId);
          }
        } catch (error) {
          console.error("Error fetching session ID:", error);
        } finally {
          setSessionIdIsLoading(false);
        }
      }
    };

    fetchSessionId();
  }, []);

  useEffect(() => {
    // Fetch chat history once sessionId is available
    const fetchChatHistory = async () => {
      if (!sessionId) return;

      try {
        setSessionIdIsLoading(true);
        const response = await axiosApiInstance.post("/ai/message-history", {
          sessionId,
        });

        if (response.data && response.data.data) {
          const formattedChats = response.data.data.map(
            (message: any, index: number) => ({
              id: `chat-${index}`,
              content: message.kwargs.content,
              role: message.id.includes("HumanMessage") ? "user" : "assistant",
              updateAt: Date.now(),
              createAt: Date.now(),
            })
          );

          setInitialChats(formattedChats);
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
      } finally {
        setSessionIdIsLoading(false);
      }
    };

    fetchChatHistory();
  }, [sessionId]);

  const handleRequest = async (messages: any[]) => {
    const latestMessage = messages[messages.length - 1];
    try {
      const response = await axiosApiInstance.post("/ai/ask", {
        question: latestMessage.content,
        sessionId: sessionId,
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

  const clearSession = async () => {
    const response = await axiosApiInstance.post("/ai/message-history/clear", {
      sessionId: sessionId,
    });

    console.log(response.data.data);
  };

  if (sessionIdIsLoading) {
    return (
      <Flex justify="center" style={{ width: "100%" }}>
        <Loader />
      </Flex>
    );
  }

  if (!sessionIdIsLoading && sessionId && initialChats) {
    return (
      <ProChat
        onResetMessage={clearSession}
        style={{ height: "100%" }}
        request={handleRequest}
        locale="en-US"
        helloMessage="Hello! I am Liv, I can answer any question you might have about this project?"
        placeholder="Type your question here..."
        initialChats={initialChats}
      />
    );
  }
}
