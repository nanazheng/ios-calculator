<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { nextTick } from 'vue';

type TSystemInfo = {
  windowWidth: number;
  windowHeight: number;
  screenWidth: number; // 屏幕宽度
  screenHeight: number; // 屏幕高度
  afeAreaInsets?: number; // iPhone 安全区域底部
};

onLaunch(() => {
  console.log("App Launch");
  uni.getSystemInfo({
    success: (res) => {
      console.log('res', res)
      const systemInfo: TSystemInfo = {
        windowWidth: res.windowWidth, // 可使用窗口宽度
        windowHeight: res.windowHeight, // 可使用窗口高度
        screenWidth: res.screenWidth, // 屏幕宽度
        screenHeight: res.screenHeight, // 屏幕高度
        afeAreaInsets: res.safeAreaInsets?.bottom || 0,
      };
      nextTick(() => {
        // 定义全局变量
        getApp().globalData = {
          ...getApp().globalData,
          systemInfo,
        };
      });
    },
  });
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style>
.safe-bottom-padding {
  padding-top: constant(safe-area-inset-top);
  padding-left: constant(safe-area-inset-left);
  padding-right: constant(safe-area-inset-right);
  padding-bottom: constant(safe-area-inset-bottom);
}
</style>
