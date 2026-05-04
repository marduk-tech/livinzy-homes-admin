export interface ConversationMessage {
  input: string;
  inputAt?: string;
  output: string;
  outputAt?: string;
  traceId: string;
}

export interface ConversationThread {
  threadId: string;
  firstQuestion: string;
  startTime: string;
  messages: ConversationMessage[];
}
