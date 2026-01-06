import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ArrowLeft, Search, FileText, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function CaseQuery() {
  const [caseNumber, setCaseNumber] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [progressData, setProgressData] = useState<any[]>([]);

  const { refetch: refetchCase, isFetching: isFetchingCase } = trpc.cases.getByCaseNumber.useQuery(
    { caseNumber },
    { 
      enabled: false,
      retry: false
    }
  );

  const { refetch: refetchProgress, isFetching: isFetchingProgress } = trpc.cases.getProgress.useQuery(
    { caseId: searchResult?.id || 0 },
    { 
      enabled: false,
      retry: false
    }
  );

  const handleSearch = async () => {
    if (!caseNumber.trim()) {
      toast.error("請輸入案件編號");
      return;
    }

    const result = await refetchCase();
    
    if (result.data) {
      setSearchResult(result.data);
      
      // 查詢進度記錄
      const progressResult = await refetchProgress();
      if (progressResult.data) {
        setProgressData(progressResult.data);
      }
      
      toast.success("查詢成功");
    } else {
      setSearchResult(null);
      setProgressData([]);
      toast.error("查無此案件編號，請確認後重試");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      submitted: { label: "已提交", className: "bg-blue-100 text-blue-800" },
      reviewing: { label: "審核中", className: "bg-yellow-100 text-yellow-800" },
      processing: { label: "處理中", className: "bg-orange-100 text-orange-800" },
      completed: { label: "已完成", className: "bg-green-100 text-green-800" },
      rejected: { label: "已拒絕", className: "bg-red-100 text-red-800" }
    };
    
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; className: string }> = {
      low: { label: "低", className: "bg-gray-100 text-gray-800" },
      medium: { label: "中", className: "bg-blue-100 text-blue-800" },
      high: { label: "高", className: "bg-orange-100 text-orange-800" },
      urgent: { label: "緊急", className: "bg-red-100 text-red-800" }
    };
    
    const priorityInfo = priorityMap[priority] || { label: priority, className: "bg-gray-100 text-gray-800" };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityInfo.className}`}>
        {priorityInfo.label}
      </span>
    );
  };

  const getProgressStatusIcon = (status: string) => {
    if (status === "completed") {
      return <div className="w-3 h-3 rounded-full bg-green-500" />;
    } else if (status === "in_progress") {
      return <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />;
    } else {
      return <div className="w-3 h-3 rounded-full bg-gray-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回首頁
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">案件查詢</CardTitle>
              <CardDescription className="text-base">
                請輸入您的案件編號查詢案件狀態與進度
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="caseNumber" className="sr-only">案件編號</Label>
                  <Input
                    id="caseNumber"
                    placeholder="請輸入案件編號（例如：CS1234567890）"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  disabled={isFetchingCase || isFetchingProgress}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {(isFetchingCase || isFetchingProgress) ? "查詢中..." : "查詢"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {searchResult && (
            <>
              <Card className="animate-fadeIn">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{searchResult.title}</CardTitle>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-muted-foreground">
                          案件編號：{searchResult.caseNumber}
                        </span>
                        {getStatusBadge(searchResult.status)}
                        {getPriorityBadge(searchResult.priority)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        案件資訊
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">案件類型：</span>
                          <span className="font-medium">{searchResult.caseType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">申請人：</span>
                          <span className="font-medium">{searchResult.applicantName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">聯絡電話：</span>
                          <span className="font-medium">{searchResult.applicantPhone}</span>
                        </div>
                        {searchResult.applicantEmail && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">聯絡信箱：</span>
                            <span className="font-medium">{searchResult.applicantEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        時間資訊
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">提交時間：</span>
                          <span className="font-medium">
                            {format(new Date(searchResult.createdAt), "PPP HH:mm", { locale: zhTW })}
                          </span>
                        </div>
                        {searchResult.estimatedCompletionDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">預計完成：</span>
                            <span className="font-medium">
                              {format(new Date(searchResult.estimatedCompletionDate), "PPP", { locale: zhTW })}
                            </span>
                          </div>
                        )}
                        {searchResult.completedAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">完成時間：</span>
                            <span className="font-medium">
                              {format(new Date(searchResult.completedAt), "PPP HH:mm", { locale: zhTW })}
                            </span>
                          </div>
                        )}
                        {searchResult.currentStep && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">當前進度：</span>
                            <span className="font-medium">{searchResult.currentStep}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">案件描述</h4>
                    <p className="text-muted-foreground bg-muted p-4 rounded-lg whitespace-pre-wrap">
                      {searchResult.description}
                    </p>
                  </div>

                  {searchResult.notes && (
                    <div>
                      <h4 className="font-semibold mb-2">備註</h4>
                      <p className="text-muted-foreground bg-muted p-4 rounded-lg">
                        {searchResult.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {progressData.length > 0 && (
                <Card className="animate-fadeIn">
                  <CardHeader>
                    <CardTitle className="text-xl">處理進度</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {progressData.map((progress, index) => (
                        <div key={progress.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            {getProgressStatusIcon(progress.status)}
                            {index < progressData.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 my-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-start justify-between mb-1">
                              <h5 className="font-semibold">{progress.step}</h5>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(progress.createdAt), "PPP HH:mm", { locale: zhTW })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {progress.description}
                            </p>
                            {progress.notes && (
                              <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                備註：{progress.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p className="font-semibold mb-1">聯絡資訊</p>
                      <p>如有任何疑問，請聯絡我們：</p>
                      <p>電話：(089) XXX-XXXX</p>
                      <p>Email: info@taitung-disaster.gov.tw</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!searchResult && (
            <Card className="bg-muted/50">
              <CardContent className="py-12 text-center">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  請輸入案件編號進行查詢
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
