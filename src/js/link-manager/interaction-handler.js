
/**
 * InteractionHandler
 * 负责注册全局函数和处理点击事件
 */

import Swal from "sweetalert2";
import { copy } from "../utils.js";


export class InteractionHandler {
  /**
   * 更新全局函数
   * @param {Object} config - 配置对象
   */
  updateGlobalFunctions(config) {
    if (!config) return;

    // 更新邮箱函数
    if (config.personal?.email) {
      window.email = () => {
        Swal.fire({
          title: "E-mail",
          text: config.personal.email,
          confirmButtonText: "Copy",
          cancelButtonText: "Cancel",
          showDenyButton: false,
          showCloseButton: true,
        }).then((result) => {
            if (result.isConfirmed) {
              copy(config.personal.email);
            }
          });
      };
    }

    // 更新 Session ID 函数
    if (config.personal?.sessionId) {
      window.session_id = () => {
        Swal.fire({
          title: "Session ID",
          text: config.personal.sessionId,
          showCancelButton: true,
          confirmButtonText: "OK",
          cancelButtonText: "Copy",
        }).then((result) => {
            if (!result.isConfirmed && copy) {
              copy(config.personal.sessionId);
            }
          });
      };
    }

    // 更新赞助函数
    if (config.sponsor) {
      // 动态获取 t 函数，而非在定义时捕获（i18n 初始化是异步的）
      const _t = (key) => (window.t ? window.t(key) : key);

      const showConfirmDialog = (url) => {
        Swal.fire({
          title: _t("sponsor.confirmDialog.title"),
          text: _t("sponsor.confirmDialog.text"),
          showCancelButton: true,
          confirmButtonText: _t("sponsor.confirmDialog.confirm"),
          cancelButtonText: _t("sponsor.confirmDialog.cancel"),
        }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = url;
            }
          });
      };

      window.sponsor_patreon = () => {
        showConfirmDialog(config.sponsor.patreon);
      };

      window.sponsor_afdian = () => {
        showConfirmDialog(config.sponsor.afdian);
      };

      window.sponsor_opencollective = () => {
        showConfirmDialog(config.sponsor.opencollective);
      };

      window.sponsor_wechat = () => {
        Swal.fire({
          title: _t("sponsor.confirmDialog.title"),
          html: `<img src="${config.sponsor.wechatQR}" width="200" height="200" />`,
          showCancelButton: true,
          confirmButtonText: "OK",
          cancelButtonText: _t("sponsor.confirmDialog.cancel"),
        });
      };
    }
  }
}
