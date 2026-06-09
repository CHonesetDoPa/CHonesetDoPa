import swal from "sweetalert";
import { copy } from "../utils.js";

/**
 * InteractionHandler
 * 负责注册全局函数和处理点击事件
 */
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
        swal({
          title: "E-mail",
          text: config.personal.email,
          buttons: ["Copy", true],
        }).then((OK) => {
            if (!OK && copy) {
              copy(config.personal.email);
            }
          });
      };
    }

    // 更新 Session ID 函数
    if (config.personal?.sessionId) {
      window.session_id = () => {
        swal({
          title: "Session ID",
          text: config.personal.sessionId,
          buttons: ["Copy", true],
        }).then((OK) => {
            if (!OK && copy) {
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
        swal({
          title: _t("sponsor.confirmDialog.title"),
          text: _t("sponsor.confirmDialog.text"),
          buttons: [
            _t("sponsor.confirmDialog.cancel"),
            _t("sponsor.confirmDialog.confirm"),
          ],
        }).then((OK) => {
            if (OK) {
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
        swal({
          title: _t("sponsor.confirmDialog.title"),
          text: _t("sponsor.confirmDialog.text"),
          content: {
            element: "img",
            attributes: {
              src: config.sponsor.wechatQR,
              width: 200,
              height: 200,
            },
          },
          buttons: [_t("sponsor.confirmDialog.cancel"), true],
        });
      };
    }
  }
}
