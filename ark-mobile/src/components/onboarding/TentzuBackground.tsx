import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const BACKDROP = require('../../../assets/images/app-backdrop.jpg');

/**
 * App-wide ambient backdrop.
 *
 * Replaces the old SVG Dubai skyline — Tentzu is no longer a Dubai-only
 * product, and a literal skyline behind every screen both dated the app and
 * contradicted the worldwide positioning.
 *
 * This is a heavily blurred derivative of the brand artwork, not the artwork
 * itself: at this blur radius it supplies ambient colour and a sense of depth
 * for glass surfaces to refract, while carrying no legible detail to compete
 * with content. That is the point — Apple's Liquid Glass guidance is explicit
 * that background detail should dissolve into soft colour behind translucent
 * surfaces so text stays readable.
 *
 * Rendered absolutely, pointerEvents="none", so it never intercepts touches.
 */
export function TentzuBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={BACKDROP}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        // The plate is static and shared by every screen — cache it in memory
        // so switching screens never re-decodes it.
        cachePolicy="memory-disk"
        transition={0}
      />

      {/* Luminance scrim: lifts the top of the screen where headlines sit and
          settles the bottom where the sticky action bar sits, so both ends have
          predictable contrast regardless of what the photo is doing there. */}
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.12)', 'rgba(214,236,239,0.42)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
