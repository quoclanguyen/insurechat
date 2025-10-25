import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Upload,
  LogOut,
  FileText,
  Shield,
  Loader2,
  Check,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import ComparisonTable from "@/components/ComparisonTable";
import RecommendationCards from "@/components/RecommendationCards";
import FileUploadDialog from "@/components/FileUploadDialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: any;
  agentStage?: "agent1" | "agent5" | "complete";
  needsApproval?: boolean;
  feedback?: string;
}

interface Source {
  id: string;
  name: string;
  file_type: string;
  created_at: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentAgentStage, setCurrentAgentStage] = useState<"agent1" | "agent2" | "agent3" | "agent4" | "agent5" | "complete" | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState("");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [agentResults, setAgentResults] = useState<{[key: string]: string}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    "https://flask-multi-agent.onrender.com";

  useEffect(() => {
    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadSources();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadSources = async () => {
    const { data, error } = await supabase
      .from("sources")
      .select("id, name, file_type, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading sources:", error);
      return;
    }

    setSources(data || []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || sending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setSending(true);
    setCurrentAgentStage("agent1");

    try {
      // Gọi Agent đầu tiên
      const response = await fetch(`${BASE_URL}/agent1`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify({
          "data_query": message
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.result || "Đã nhận được phản hồi từ Agent phân tích dữ liệu",
        response: data,
        agentStage: "agent1",
        needsApproval: true
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Không thể gửi tin nhắn");
      // Remove user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleApproveAgent1 = async () => {
    setSending(true);
    try {
      const originalQuery = messages[messages.length - 2]?.content || "";
      const agent1Result = messages[messages.length - 1]?.content || "";
      
      // Lưu kết quả Agent 1
      setAgentResults(prev => ({ ...prev, agent1: agent1Result }));
      
      // Chạy Agent 2
      setCurrentAgentStage("agent2");
      const agent2Response = await fetch(`${BASE_URL}/agent2`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify({
          "data_query": originalQuery,
          "analysis_result": agent1Result
        })
      });

      if (!agent2Response.ok) {
        throw new Error(`HTTP error! status: ${agent2Response.status}`);
      }

      const agent2Data = await agent2Response.json();
      const agent2Result = agent2Data.result || "";
      setAgentResults(prev => ({ ...prev, agent2: agent2Result }));

      // Chạy Agent 3
      setCurrentAgentStage("agent3");
      const agent3Response = await fetch(`${BASE_URL}/agent3`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify({
          "data_query": originalQuery,
          "analysis_result": agent1Result,
          "optimization_result": agent2Result
        })
      });

      if (!agent3Response.ok) {
        throw new Error(`HTTP error! status: ${agent3Response.status}`);
      }

      const agent3Data = await agent3Response.json();
      const agent3Result = agent3Data.result || "";
      setAgentResults(prev => ({ ...prev, agent3: agent3Result }));

      // Chạy Agent 4
      setCurrentAgentStage("agent4");
      const agent4Response = await fetch(`${BASE_URL}/agent4`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify({
          "data_query": originalQuery,
          "analysis_result": agent1Result,
          "optimization_result": agent2Result,
          "additional_insights": agent3Result
        })
      });

      if (!agent4Response.ok) {
        throw new Error(`HTTP error! status: ${agent4Response.status}`);
      }

      const agent4Data = await agent4Response.json();
      const agent4Result = agent4Data.result || "";
      setAgentResults(prev => ({ ...prev, agent4: agent4Result }));

      // Chạy Agent 5
      setCurrentAgentStage("agent5");
      const agent5Response = await fetch(`${BASE_URL}/agent5`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify({
          "data_query": originalQuery,
          "analysis_result": agent1Result,
          "optimization_result": agent2Result,
          "additional_insights": agent3Result,
          "qa_result": agent4Result
        })
      });

      if (!agent5Response.ok) {
        throw new Error(`HTTP error! status: ${agent5Response.status}`);
      }

      const agent5Data = await agent5Response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: agent5Data.result || "Đã nhận được báo cáo cuối cùng",
        response: agent5Data,
        agentStage: "agent5",
        needsApproval: true
      };

      setMessages(prev => [...prev, assistantMessage]);
      setAgentResults(prev => ({ ...prev, agent5: agent5Data.result || "" }));
    } catch (error: any) {
      console.error("Error processing agents:", error);
      toast.error(error.message || "Không thể xử lý yêu cầu");
    } finally {
      setSending(false);
    }
  };

  const handleApproveAgent5 = () => {
    setCurrentAgentStage("complete");
    setMessages(prev => prev.map(msg =>
      msg.id === messages[messages.length - 1].id
        ? { ...msg, needsApproval: false, agentStage: "complete" }
        : msg
    ));
    toast.success("Quá trình phân tích hoàn tất!");
  };

  const handleFeedbackAgent1 = async () => {
    if (!pendingFeedback.trim()) {
      toast.error("Vui lòng nhập feedback");
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${BASE_URL}/agent1`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify({
          "data_query": messages[messages.length - 2]?.content || "",
          "feedback": pendingFeedback
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.result || "Đã nhận được phản hồi cập nhật từ Agent phân tích dữ liệu",
        response: data,
        agentStage: "agent1",
        needsApproval: true
      };

      setMessages(prev => [...prev, assistantMessage]);
      setPendingFeedback("");
      setShowFeedbackInput(false);
    } catch (error: any) {
      console.error("Error sending feedback:", error);
      toast.error(error.message || "Không thể gửi feedback");
    } finally {
      setSending(false);
    }
  };

  const handleFeedbackAgent5 = async () => {
    if (!pendingFeedback.trim()) {
      toast.error("Vui lòng nhập feedback");
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${BASE_URL}/agent5`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify({
          "data_query": messages[messages.length - 3]?.content || "",
          "analysis_result": agentResults.agent1 || "",
          "optimization_result": agentResults.agent2 || "",
          "additional_insights": agentResults.agent3 || "",
          "qa_result": agentResults.agent4 || "",
          "feedback": pendingFeedback
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.result || "Đã nhận được báo cáo cập nhật",
        response: data,
        agentStage: "agent5",
        needsApproval: true
      };

      setMessages(prev => [...prev, assistantMessage]);
      setPendingFeedback("");
      setShowFeedbackInput(false);
    } catch (error: any) {
      console.error("Error sending feedback:", error);
      toast.error(error.message || "Không thể gửi feedback");
    } finally {
      setSending(false);
    }
  };

  const handleUploadComplete = (source: Source) => {
    setSources(prev => [source, ...prev]);
    setUploadDialogOpen(false);
    toast.success("Tải file thành công!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const lastResponse = messages.length > 0 && messages[messages.length - 1].role === "assistant"
    ? messages[messages.length - 1].response
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">InsureChat VN</h1>
              <p className="text-xs text-muted-foreground">Trợ lý phân tích bảo hiểm</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Tải tài liệu
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4 h-[calc(100vh-280px)] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Chào mừng đến với InsureChat VN</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Tải lên tài liệu bảo hiểm của bạn và đặt câu hỏi để nhận phân tích chi tiết, so sánh gói bảo hiểm và đề xuất phù hợp.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <Avatar className="w-8 h-8 border-2 border-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs">
                            AI
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user"
                          ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground"
                          : "bg-muted"
                          }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>

                            {/* Agent Interaction UI */}
                            {msg.needsApproval && (
                              <div className="mt-4 p-3 bg-background/50 rounded-lg border">
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge variant="outline" className="text-xs">
                                    {msg.agentStage === "agent1" && "Agent 1 - Phân tích dữ liệu"}
                                    {msg.agentStage === "agent2" && "Agent 2 - Tối ưu hóa quy trình"}
                                    {msg.agentStage === "agent3" && "Agent 3 - Phân tích bổ sung"}
                                    {msg.agentStage === "agent4" && "Agent 4 - Đảm bảo chất lượng"}
                                    {msg.agentStage === "agent5" && "Agent 5 - Báo cáo cuối"}
                                  </Badge>
                                  {currentAgentStage && currentAgentStage !== "agent1" && currentAgentStage !== "agent5" && (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        Đang xử lý {currentAgentStage}...
                                      </Badge>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                  <Button
                                    size="sm"
                                    onClick={msg.agentStage === "agent1" ? handleApproveAgent1 : handleApproveAgent5}
                                    disabled={sending}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Duyệt
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowFeedbackInput(!showFeedbackInput)}
                                    disabled={sending}
                                  >
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                    Feedback
                                  </Button>
                                </div>

                                {showFeedbackInput && (
                                  <div className="mt-3 space-y-2">
                                    <Input
                                      placeholder="Nhập feedback của bạn..."
                                      value={pendingFeedback}
                                      onChange={(e) => setPendingFeedback(e.target.value)}
                                      className="text-sm"
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={msg.agentStage === "agent1" ? handleFeedbackAgent1 : handleFeedbackAgent5}
                                        disabled={sending || !pendingFeedback.trim()}
                                        className="bg-blue-600 hover:bg-blue-700"
                                      >
                                        Gửi Feedback
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setShowFeedbackInput(false);
                                          setPendingFeedback("");
                                        }}
                                      >
                                        Hủy
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <Avatar className="w-8 h-8 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-xs">
                            {user?.email?.[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Selected Sources */}
              {selectedSources.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-2">
                  {selectedSources.map(sourceId => {
                    const source = sources.find(s => s.id === sourceId);
                    return source ? (
                      <Badge key={sourceId} variant="secondary" className="text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        {source.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Đặt câu hỏi về bảo hiểm..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!message.trim() || sending}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Sources */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Tài liệu ({sources.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sources.map((source) => (
                  <label
                    key={source.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(source.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSources([...selectedSources, source.id]);
                        } else {
                          setSelectedSources(selectedSources.filter(id => id !== source.id));
                        }
                      }}
                      className="rounded border-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{source.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(source.created_at).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </label>
                ))}
                {sources.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Chưa có tài liệu nào
                  </p>
                )}
              </div>
            </Card>

            {/* Results */}
            {lastResponse && (
              <>
                {lastResponse.comparison_table && lastResponse.comparison_table.length > 0 && (
                  <ComparisonTable data={lastResponse.comparison_table} />
                )}

                {lastResponse.recommendations && lastResponse.recommendations.length > 0 && (
                  <RecommendationCards recommendations={lastResponse.recommendations} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
};

export default Chat;