import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchAppLinks } from "../../store/setting/setting.action";
import { projectName } from "../../../util/config";
import { buildWebDestination } from "../../../util/shareDestination";
import logo from "../../../assets/images/share.png";
import styles from "./share.module.css";

// const FALLBACK_WEBSITE_URL = "http://192.168.1.64:5000/";

const SharePage = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { appLinks } = useSelector((state) => state.setting);

  const queryParams = useMemo(
    () => ({
      pageRoute: searchParams.get("pageRoute") ?? undefined,
      id: searchParams.get("id") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
      episodeNumber: searchParams.get("episodeNumber") ?? undefined,
      movieName: searchParams.get("movieName") ?? undefined,
      roomId: searchParams.get("roomId") ?? undefined,
      liveUserId: searchParams.get("liveUserId") ?? undefined,
      image: searchParams.get("image") ?? undefined,
      name: searchParams.get("name") ?? undefined,
      username: searchParams.get("username") ?? undefined,
    }),
    [searchParams]
  );

  useEffect(() => {
    dispatch(fetchAppLinks());
  }, [dispatch]);

  const webDestination = useMemo(
    () => buildWebDestination(queryParams, appLinks?.websiteUrl),
    [appLinks?.websiteUrl, queryParams]
  );

  // const webDestination = useMemo(() => {
  //   const websiteUrl = appLinks?.websiteUrl || FALLBACK_WEBSITE_URL;
  //   return buildWebDestination(queryParams, websiteUrl);
  // }, [appLinks?.websiteUrl, queryParams]);

  const handleGoToWeb = () => {
    if (webDestination) {
      window.location.href = webDestination;
    }
  };

  const openLink = (url) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.gradientBackground}>
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.textColumn}>
              <h1 className={styles.heading}>
                <span className={styles.gradientText}>Watch Videos</span>
                <span className={styles.normalText}>On the Go</span>
              </h1>

              <p className={styles.subheading}>
                Stream videos, explore channels, and join live broadcasts with{" "}
                {projectName}. Enjoy smooth playback, real-time updates, and
                engaging content — all in one place. Download the {projectName}{" "}
                app today and watch anytime, anywhere.
              </p>

              <div className={styles.ctaRow}>
                <button
                  type="button"
                  onClick={() => openLink(appLinks?.iosAppLink)}
                  className={styles.storeButton}
                >
                  <img
                    src={`${process.env.PUBLIC_URL}/images/appStore.svg`}
                    className={styles.icon}
                    alt="App Store"
                  />
                  <div>
                    <div className={styles.storeLabelTop}>Download on the</div>
                    <div className={styles.storeLabelBottom}>App Store</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => openLink(appLinks?.androidAppLink)}
                  className={styles.storeButtonPurple}
                >
                  <img
                    src={`${process.env.PUBLIC_URL}/images/playStoree.svg`}
                    className={styles.icon}
                    alt="Play Store"
                  />
                  <div>
                    <div className={styles.storeLabelTop}>Get it on</div>
                    <div className={styles.storeLabelBottom}>Play Store</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleGoToWeb}
                  className={styles.storeButtonPurple}
                >
                  <img
                    src={`${process.env.PUBLIC_URL}/images/web.svg`}
                    className={styles.icon}
                    alt="Website"
                  />
                  <div>
                    <div className={styles.storeLabelTop}>Visit our</div>
                    <div className={styles.storeLabelBottom}>Website</div>
                  </div>
                </button>
              </div>

              <div className={styles.featuresWrapper}>
                <p className={styles.featuresTitle}>
                  Available on all major platforms
                </p>

                <div className={styles.featuresRow}>
                  <span>✓ Free Download</span>
                  <span>✓ Regular Updates</span>
                  <span>✓ 24/7 Support</span>
                </div>
              </div>
            </div>

            <div className={styles.imageColumn}>
              <img src={logo} alt="preview" className={styles.phoneImage} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePage;
