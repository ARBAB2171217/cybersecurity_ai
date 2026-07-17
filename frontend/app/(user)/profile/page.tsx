"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfilePictureUpload } from "@/components/profile/ProfilePictureUpload";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { ActiveSessions } from "@/components/profile/ActiveSessions";
import { AccountActions } from "@/components/profile/AccountActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { User, Shield, MonitorSmartphone, Settings } from "lucide-react";

export default function ProfilePage() {
  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings" },
  ];

  return (
    <PageContainer className="max-w-4xl mx-auto">
      <div className="space-y-2 mb-8">
        <Breadcrumb items={breadcrumbItems} />
        <h1 className="text-2xl font-black text-foreground tracking-tight sm:text-3xl">
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account profile, security preferences, and active sessions.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 h-auto mb-8 bg-card border shadow-sm">
          <TabsTrigger value="general" className="py-3 data-[state=active]:bg-primary/5 data-[state=active]:text-primary">
            <User className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="py-3 data-[state=active]:bg-primary/5 data-[state=active]:text-primary">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="sessions" className="py-3 data-[state=active]:bg-primary/5 data-[state=active]:text-primary">
            <MonitorSmartphone className="w-4 h-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="advanced" className="py-3 data-[state=active]:bg-primary/5 data-[state=active]:text-primary">
            <Settings className="w-4 h-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 focus-visible:outline-none">
          <ProfilePictureUpload />
          <ProfileForm />
        </TabsContent>

        <TabsContent value="security" className="space-y-6 focus-visible:outline-none">
          <ChangePasswordForm />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6 focus-visible:outline-none">
          <ActiveSessions />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6 focus-visible:outline-none">
          <AccountActions />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
