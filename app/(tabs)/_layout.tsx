import { CustomTabBar } from "@/components/ui/custom-tab-bar";
import {
  tabSlideSceneInterpolator,
  tabSlideTransitionSpec,
} from "@/components/ui/tab-slide-transition";
import { Colors } from "@/constants/colors";
import { useAuthStore } from "@/store/auth-store";
import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isProjectOwner = user?.user_type === "project_owner";
  const isInvestor = user?.user_type === "investor";
  const showMyProjects = isProjectOwner || isInvestor;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        transitionSpec: tabSlideTransitionSpec,
        sceneStyleInterpolator: tabSlideSceneInterpolator,
        sceneStyle: { backgroundColor: Colors.appBg },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: t("home"),
        }}
      />

      <Tabs.Screen
        name="profile/index"
        options={{
          title: t("profile"),
          href: null,
        }}
      />

      {/* Profile: hidden from tab bar, accessible via settings or deep link */}
      <Tabs.Screen
        name="conversations/index"
        options={{
          title: t("messages"),
        }}
      />
     <Tabs.Screen
        name="saved/index"
        options={{
          title: showMyProjects ? t("my_projects") : t("saved"),
        }}
      />
      <Tabs.Screen
        name="favorites/index"
        options={{
          title: t("favorites_label", { defaultValue: "Favorites" }),
        }}
      />

 

      <Tabs.Screen
        name="settings/index"
        options={{
          title: t("settings"),
        }}
      />

    </Tabs>
  );
}