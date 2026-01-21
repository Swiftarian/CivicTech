import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import { Link, useParams } from "wouter";

export default function NewsDetail() {
  const params = useParams();
  const newsId = Number(params.id);
  
  const { data: news, isLoading } = trpc.news.getById.useQuery({ id: newsId });

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { className: string }> = {
      "防災宣導": { className: "bg-red-100 text-red-800" },
      "活動公告": { className: "bg-blue-100 text-blue-800" },
      "新聞稿": { className: "bg-green-100 text-green-800" },
      "其他": { className: "bg-gray-100 text-gray-800" }
    };
    
    const info = categoryMap[category] || categoryMap["其他"];
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${info.className}`}>
        {category}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container py-8">
        <Link href="/news">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
        </Link>

        {isLoading ? (
          <Card className="max-w-4xl mx-auto animate-pulse">
            <CardHeader>
              <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ) : news ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  {getCategoryBadge(news.category)}
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {news.publishedAt && format(new Date(news.publishedAt), "yyyy年MM月dd日 HH:mm", { locale: zhTW })}
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    瀏覽 {news.viewCount || 0} 次
                  </span>
                </div>
                <CardTitle className="text-3xl md:text-4xl leading-tight">
                  {news.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {news.coverImage && news.coverImage.trim() !== '' && (
                  <div className="rounded-lg overflow-hidden bg-muted">
                    <img
                      src={news.coverImage}
                      alt={news.title}
                      className="w-full h-auto object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                )}
                
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {news.content}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Link href="/news">
                <Button variant="outline" size="lg">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回最新消息列表
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <Card className="max-w-4xl mx-auto">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg mb-4">找不到此消息</p>
              <Link href="/news">
                <Button>返回列表</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
