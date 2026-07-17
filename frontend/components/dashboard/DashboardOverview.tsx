"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Shield, ShieldAlert, CheckCircle2, TrendingUp, Scan, Globe, Camera, FileText, Users, Bookmark, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

import { motion } from "framer-motion";

interface DashboardOverviewProps {
  stats: {
    totalScans: number;
    counterfeitCount: number;
    genuineCount: number;
    accuracyRate: number;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function DashboardOverview({ stats }: DashboardOverviewProps) {
  const safeStats = stats ?? {
    totalScans: 0,
    counterfeitCount: 0,
    genuineCount: 0,
    accuracyRate: 0,
  };

  const statCards = [
    { title: "Total Scans", value: safeStats.totalScans, icon: Shield, color: "text-blue-500", bg: "bg-blue-500/10", desc: "Processed evidence count" },
    { title: "Threats Detected", value: safeStats.counterfeitCount, icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10", desc: "Suspicious items flagged" },
    { title: "Safe Evidence", value: safeStats.genuineCount, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", desc: "Authentic items verified" },
    { title: "AI Confidence", value: `${safeStats.accuracyRate}%`, icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10", desc: "Average model accuracy" },
  ];

  const primaryModules = [
    { title: "Universal AI Scanner", desc: "Upload, paste, or capture any evidence for automatic AI classification", icon: Scan, href: "#scanner", color: "text-blue-400", bg: "bg-blue-500/10", border: "group-hover:border-blue-500/50" },
  ];

  const secondaryModules = [
    { title: "Reports", desc: "View past scan history", icon: FileText, href: ROUTES.REPORTS, color: "text-zinc-300", bg: "bg-zinc-500/20" },
    { title: "Community", desc: "Collaborate with peers", icon: Users, href: ROUTES.COMMUNITY, color: "text-zinc-300", bg: "bg-zinc-500/20" },
    { title: "Bookmarks", desc: "Saved intelligence", icon: Bookmark, href: ROUTES.BOOKMARKS, color: "text-zinc-300", bg: "bg-zinc-500/20" },
    { title: "Analytics", desc: "View personal metrics", icon: LayoutDashboard, href: ROUTES.ANALYTICS, color: "text-zinc-300", bg: "bg-zinc-500/20" },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="relative overflow-hidden border-border/40 bg-zinc-950/40 backdrop-blur-md shadow-lg transition-all hover:bg-zinc-900/60 hover:shadow-xl hover:-translate-y-1">
              <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 rounded-full ${stat.bg}`} />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} shadow-inner`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-foreground tracking-tight">{stat.value}</h3>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">{stat.title}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1.5">{stat.desc}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground tracking-tight">Intelligence Pipelines</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent ml-4" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {primaryModules.map((mod, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Link href={mod.href} className="group block h-full">
                <Card className={`h-full relative overflow-hidden bg-zinc-950/50 border-border/40 transition-all duration-300 hover:shadow-2xl hover:bg-zinc-900/80 ${mod.border}`}>
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-transparent to-current transition-opacity duration-500 ${mod.color}`} />
                  <CardContent className="p-6 flex flex-col h-full relative z-10">
                    <div className={`p-3 rounded-2xl w-fit mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${mod.bg} ${mod.color} shadow-lg`}>
                      <mod.icon className="h-6 w-6" />
                    </div>
                    <h4 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{mod.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-auto">{mod.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {secondaryModules.map((mod, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Link href={mod.href} className="group block h-full">
                <Card className="h-full bg-zinc-950/30 border-border/30 transition-all duration-300 hover:bg-zinc-900/60 hover:border-border/60 hover:shadow-md">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${mod.bg} ${mod.color} transition-transform group-hover:scale-110`}>
                      <mod.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{mod.title}</h4>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default DashboardOverview;
