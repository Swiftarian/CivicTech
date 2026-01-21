import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import { Link } from "wouter";

export default function News() {
  const { data: newsList, isLoading } = trpc.news.getPublished.useQuery();

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { className: string }> = {
      防災宣導: { className: "bg-red-100 text-red-800" },
      活動公告: { className: "bg-blue-100 text-blue-800" },
      新聞稿: { className: "bg-green-100 text-green-800" },
      其他: { className: "bg-gray-100 text-gray-800" },
    };

    const info = categoryMap[category] || categoryMap["其他"];

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.className}`}
      >
        {category}
      </span>
    );
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
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">最新消息</h1>
            <p className="text-muted-foreground text-lg">
              防災宣導、活動公告與最新資訊
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : newsList && newsList.length > 0 ? (
            <div className="space-y-6">
              {newsList.map(news => (
                <Link key={news.id} href={`/news/${news.id}`}>
                  <Card className="hover-lift cursor-pointer transition-all hover:shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getCategoryBadge(news.category)}
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {news.publishedAt &&
                                format(
                                  new Date(news.publishedAt),
                                  "yyyy年MM月dd日",
                                  { locale: zhTW }
                                )}
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              {news.viewCount || 0}
                            </span>
                          </div>
                          <CardTitle className="text-2xl hover:text-primary transition-colors">
                            {news.title}
                          </CardTitle>
                        </div>
                        {news.coverImage && news.coverImage.trim() !== "" && (
                          <img
                            src={news.coverImage}
                            alt={news.title}
                            className="w-32 h-24 object-cover rounded-lg"
                            onError={e => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                      </div>
                    </CardHeader>
                    {news.summary && (
                      <CardContent>
                        <CardDescription className="text-base line-clamp-2">
                          {news.summary}
                        </CardDescription>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground text-lg">
                  目前沒有最新消息
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
