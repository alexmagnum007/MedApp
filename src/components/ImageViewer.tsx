import React, { useRef, useState } from 'react';
import {
  Modal, View, Image, StyleSheet, TouchableOpacity,
  FlatList, ScrollView, Dimensions, StatusBar, Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Props {
  images: string[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

export default function ImageViewer({ images, initialIndex = 0, visible, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatRef = useRef<FlatList>(null);

  function onOpen() {
    setCurrentIndex(initialIndex);
    setTimeout(() => {
      flatRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    }, 50);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onShow={onOpen}
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={styles.backdrop}>
        <FlatList
          ref={flatRef}
          data={images}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          renderItem={({ item }) => (
            <ScrollView
              style={{ width, height }}
              contentContainerStyle={styles.zoomContainer}
              maximumZoomScale={4}
              minimumZoomScale={1}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              centerContent
            >
              <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
            </ScrollView>
          )}
        />

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <MaterialIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {images.length > 1 && (
          <View style={styles.counter}>
            <Text style={styles.counterText}>{currentIndex + 1} / {images.length}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000' },
  zoomContainer: { width, height, justifyContent: 'center', alignItems: 'center' },
  image: { width, height },
  closeBtn: {
    position: 'absolute', top: 48, right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 6,
  },
  counter: {
    position: 'absolute', bottom: 32, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4,
  },
  counterText: { color: '#fff', fontSize: 14 },
});
