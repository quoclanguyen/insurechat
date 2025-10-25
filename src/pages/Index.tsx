import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, FileText, MessageSquare, Award } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl mb-6">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            InsureChat VN
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trợ lý AI phân tích bảo hiểm thông minh - Giúp bạn tìm gói bảo hiểm phù hợp nhất với nhu cầu và ngân sách
          </p>

          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              Bắt đầu ngay
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-xl bg-card border">
              <FileText className="w-8 h-8 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Tải tài liệu</h3>
              <p className="text-sm text-muted-foreground">Upload PDF và CSV về các gói bảo hiểm</p>
            </div>
            <div className="p-6 rounded-xl bg-card border">
              <MessageSquare className="w-8 h-8 text-secondary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Chat với AI</h3>
              <p className="text-sm text-muted-foreground">Hỏi đáp về quyền lợi, điều khoản, phí bảo hiểm</p>
            </div>
            <div className="p-6 rounded-xl bg-card border">
              <Award className="w-8 h-8 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Nhận đề xuất</h3>
              <p className="text-sm text-muted-foreground">So sánh và chọn gói phù hợp nhất</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
