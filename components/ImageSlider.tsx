import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    I18nManager,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

interface ImageSliderProps {
  images: string[];
  isRTL?: boolean;
}

const defaultImage = require("@/assets/images/no_project_default.jpeg");

export const ImageSlider = ({ images, isRTL = I18nManager.isRTL }: ImageSliderProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [isFullscreenVisible, setIsFullscreenVisible] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const viewedIndex = viewableItems[0].index ?? 0;
      setActiveIndex(Math.max(0, viewedIndex));
    }
  }, []);

  // Ensure images is always an array
  const safeImages = Array.isArray(images) && images.length > 0
    ? images.filter(img => img && typeof img === "string" && img.trim().length > 0)
    : [];
  useEffect(() => {
    if (activeIndex > Math.max(0, safeImages.length - 1)) {
      setActiveIndex(0);
    }
  }, [activeIndex, safeImages.length]);

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index);
    setActiveIndex(index);
    setIsFullscreenVisible(true);
  };

  const closeFullscreen = () => {
    setIsFullscreenVisible(false);
  };

  // If no images, show default image
  if (safeImages.length === 0) {
    return (
      <View style={styles.container}>
        <Image
          source={defaultImage}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={safeImages}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        inverted={isRTL}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        renderItem={({ item, index }) => {
          const hasError = imageErrors.has(index);
          const imageSource = hasError || !item || !item.trim()
            ? defaultImage
            : { uri: item };

          return (
            <Pressable onPress={() => openFullscreen(index)}>
              <Image
                source={imageSource}
                style={styles.image}
                onError={() => handleImageError(index)}
                defaultSource={defaultImage}
              />
            </Pressable>
          );
        }}
      />
      {safeImages.length > 1 && (
        <View style={[styles.pagination, isRTL && styles.paginationRTL]}>
          {safeImages.map((_, dotIndex) => (
            <View
              key={dotIndex}
              style={[styles.dot, dotIndex === activeIndex && styles.activeDot]}
            />
          ))}
        </View>
      )}

      <Modal
        visible={isFullscreenVisible}
        transparent
        animationType="fade"
        onRequestClose={closeFullscreen}
      >
        <View style={styles.fullscreenBackdrop}>
          <Pressable style={styles.closeButton} onPress={closeFullscreen}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>

          <FlatList
            key={`fullscreen-${fullscreenIndex}`}
            data={safeImages}
            keyExtractor={(item, index) => `fullscreen-${index}`}
            horizontal
            inverted={isRTL}
            pagingEnabled
            initialScrollIndex={fullscreenIndex}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 50,
            }}
            renderItem={({ item, index }) => {
              const hasError = imageErrors.has(index);
              const imageSource = hasError || !item || !item.trim()
                ? defaultImage
                : { uri: item };

              return (
                <Pressable style={styles.fullscreenSlide} onPress={closeFullscreen}>
                  <Image
                    source={imageSource}
                    style={styles.fullscreenImage}
                    resizeMode="contain"
                    onError={() => handleImageError(index)}
                    defaultSource={defaultImage}
                  />
                </Pressable>
              );
            }}
          />

          {safeImages.length > 1 && (
            <View style={[styles.fullscreenPagination, isRTL && styles.paginationRTL]}>
              {safeImages.map((_, dotIndex) => (
                <View
                  key={`fullscreen-dot-${dotIndex}`}
                  style={[styles.dot, dotIndex === activeIndex && styles.activeDot]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    height: 350,
    position: "relative",
  },
  image: {
    width: width,
    height: "100%",
    resizeMode: "cover",
  },
  pagination: {
    position: "absolute",
    bottom: 20,
    flexDirection: "row",
    alignSelf: "center",
    gap: 8,
  },
  paginationRTL: {
    flexDirection: "row-reverse",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    opacity: 1,
  },
  activeDot: {
    backgroundColor: "#67A3B1",
    width: 25,
  },
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.96)",
    justifyContent: "center",
  },
  fullscreenSlide: {
    width,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  fullscreenImage: {
    width: width - 32,
    height: "80%",
  },
  closeButton: {
    position: "absolute",
    top: 56,
    right: 20,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenPagination: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    alignSelf: "center",
    gap: 8,
  },
});
