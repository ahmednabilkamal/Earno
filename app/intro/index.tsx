import { CustomButton } from "@/components/ui/custom-button";
import { GradientOverlay } from "@/components/ui/gradient-overlay";
import { Colors } from "@/constants/colors";
import { Fonts } from "@/constants/fonts";
import { storage } from "@/utils/storage";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";

const { width } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image: any;
}

export default function IntroScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === "ar";
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const slides: OnboardingSlide[] = [
    {
      id: "1",
      title: t("intro_slide1_title", {
        defaultValue: "Control your investments",
      }),
      description: t("intro_slide1_desc", {
        defaultValue:
          "Track all your investments from one place with a clear view of the performance of every asset and investment.",
      }),
      image: require("@/assets/images/splash_one.png"),
    },
    {
      id: "3",
      title: t("intro_slide3_title", {
        defaultValue: "Decisions based on data",
      }),
      description: t("intro_slide3_desc", {
        defaultValue:
          "Get accurate analyses and reports that help you make smarter investment decisions.",
      }),
      image: require("@/assets/images/splash_two.png"),
    },
    {
      id: "2",
      title: t("intro_slide2_title", {
        defaultValue: "Complete management with confidence and security",
      }),
      description: t("intro_slide2_desc", {
        defaultValue:
          "Manage your investment portfolio professionally with the highest standards of security and privacy.",
      }),
      image: require("@/assets/images/splash_three.png"),
    },
  ];

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    // Mark intro as seen
    await storage.setItem("has_seen_intro", "true");
    router.replace("/login");
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.image} resizeMode="cover" />
        <View style={styles.imageOverlay} />
      </View>

      <View style={styles.contentCard}>
        <View style={styles.textContent}>
          <Text style={styles.title}>{item.title}</Text>

          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.white} />
      <GradientOverlay />
      <View style={styles.contentAbove}>
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyExtractor={(item) => item.id}
          bounces={false}
          inverted={isRTL}
        />

        {/* Bottom Actions */}
        <View style={styles.bottomContainer}>
          {currentIndex < slides.length - 1 ? (
            <>
              <CustomButton
                title={t("next", { defaultValue: "Next" })}
                onPress={handleNext}
                style={styles.nextButton}
              />
            </>
          ) : (
            <CustomButton
              title={t("get_started", { defaultValue: "Get Started" })}
              onPress={handleGetStarted}
              style={styles.getStartedButton}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  contentAbove: {
    flex: 1,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  slide: {
    width: width,
    flex: 1,
  },
  imageContainer: {
    height: "70%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "transparent",
  },
  contentCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 20,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontFamily: Fonts.CairoBold,
    color: Colors.apple,
    marginBottom: 5,
    textAlign: "center",
    marginVertical: 20,
    lineHeight: 40,
  },
  description: {
    fontSize: 18,
    fontFamily: Fonts.CairoRegular,
    color: Colors.apple,
    textAlign: "center",
    lineHeight: 30,
    marginTop: 20,
    marginHorizontal: 25,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    // paddingVertical: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  bottomContainer: {
    paddingHorizontal: 30,
    paddingBottom: 10,
    paddingTop: 5,
  },
  nextButton: {
    marginBottom: 12,
    // backgroundColor: Colors.tagBg,
  },
  skipButton: {
    borderColor: Colors.primary,
  },
  getStartedButton: {
    marginBottom: 12,
  },
});
