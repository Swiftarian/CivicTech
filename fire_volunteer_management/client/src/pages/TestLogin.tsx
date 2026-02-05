import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield } from "lucide-react";

/**
 * ⚠️ 測試專用登入頁面
 *
 * 僅供資安掃描測試使用
 * 測試完成後必須刪除此檔案
 */
export default function TestLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.testLogin.useMutation({
    onSuccess: () => {
      // 登入成功，稍微延遲以確保session cookie設定完成
      setTimeout(() => {
        window.location.href = "/admin";
      }, 500);
    },
    onError: err => {
      setError(err.message || "登入失敗");
    },
  });

  // nosec: password is user input from state, not hardcoded
  // lgtm[js/hardcoded-credentials] - false positive: password from user input
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Security: Only log non-sensitive information
    console.log("[TestLogin] Login attempt for:", email);
    setError("");
    loginMutation.mutate({ email, password }); // NOSONAR - user input, not hardcoded
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-orange-600" />
            <CardTitle className="text-2xl">測試專用登入</CardTitle>
          </div>
          <CardDescription>此登入頁面僅供資安掃描測試使用</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-sm text-orange-800">
              <strong>注意：</strong>此功能僅在測試環境啟用，測試完成後將被移除
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                type="password"
                placeholder="輸入密碼"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "登入中..." : "登入"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              測試帳號資訊
            </h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div>
                <strong>管理員1:</strong> jacky.hsieh@insight.ntu.edu.tw
              </div>
              <div>
                <strong>管理員2:</strong> chelsea.juan@udngroup.com.tw
              </div>
              <div>
                <strong>志工帳號:</strong> vol3@taitung.gov.tw
              </div>
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p>請聯繫管理員獲取測試密碼。</p>
              </div>
              <div className="text-orange-600 mt-2">
                ⚠️ 僅供資安掃描測試使用
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
