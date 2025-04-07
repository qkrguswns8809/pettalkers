import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const BOTPRESS_URL = "https://cdn.botpress.cloud/webchat/v2.2/shareable.html?configUrl=https://files.bpcontent.cloud/2025/03/25/03/20250325031314-WF7GZ9CB.json";
const clientId = "bc0ef7f2-db74-45b0-a362-615e6cdd0556"; // 본인의 Client ID 사용

export default function App() {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: `${BOTPRESS_URL}?clientId=${clientId}` }}
        style={styles.webview} // 스타일 적용
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%", // 전체 너비 차지
    height: "100%", // 전체 높이 차지
  },
  webview: {
    flex: 1,
    width: "100%", // 가로 문제 해결
    height: "100%", // 높이도 명확하게 지정
  },
});
