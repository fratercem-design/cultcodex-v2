import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import { NotificationToggle } from "./notification-toggle";

export const metadata = {
  title: "Notification Preferences — CultCodex",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: user.id },
  });

  return (
    <div>
      <PageHero
        title="NOTIFICATIONS"
        subtitle="Manage your notification preferences"
        backgroundImage="/wiki-page-header.jpg"
      label="notifications"
      />
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <SectionCard title="Email Notifications">
          <div className="space-y-4 py-2">
            <NotificationToggle
              name="emailNewEpisode"
              label="New Episode Published"
              description="Get an email when a new episode is published"
              defaultChecked={prefs?.emailNewEpisode ?? false}
            />
            <NotificationToggle
              name="emailGoLive"
              label="Stream Goes Live"
              description="Get an email when the Cult of Psyche goes live"
              defaultChecked={prefs?.emailGoLive ?? false}
            />
          </div>
        </SectionCard>

        <SectionCard title="Push Notifications">
          <div className="space-y-4 py-2">
            <NotificationToggle
              name="pushGoLive"
              label="Stream Goes Live"
              description="Get a push notification when the stream starts"
              defaultChecked={prefs?.pushGoLive ?? false}
            />
          </div>
        </SectionCard>

        <p className="font-mono text-[10px] text-text-muted text-center">
          Changes are saved automatically
        </p>
      </div>
    </div>
  );
}
