import { Inject, Injectable } from '@angular/core';
import { BodyClass, IS_ELECTRON } from '../../app.constants';
import { IS_MAC } from '../../util/is-mac';
import { distinctUntilChanged, map, startWith, switchMap, take } from 'rxjs/operators';
import { IS_TOUCH_ONLY } from '../../util/is-touch-only';
import { MaterialCssVarsService } from 'angular-material-css-vars';
import { DOCUMENT } from '@angular/common';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ChromeExtensionInterfaceService } from '../chrome-extension-interface/chrome-extension-interface.service';
import { ThemeService as NgChartThemeService } from 'ng2-charts';
import { GlobalConfigService } from '../../features/config/global-config.service';
import { WorkContextThemeCfg } from '../../features/work-context/work-context.model';
import { WorkContextService } from '../../features/work-context/work-context.service';
import { combineLatest, fromEvent, Observable, of } from 'rxjs';
import { IS_FIREFOX } from '../../util/is-firefox';
import { ImexMetaService } from '../../imex/imex-meta/imex-meta.service';
import { IS_MOUSE_PRIMARY, IS_TOUCH_PRIMARY } from '../../util/is-mouse-primary';

@Injectable({ providedIn: 'root' })
export class GlobalThemeService {
  isDarkTheme$: Observable<boolean> = this._globalConfigService.misc$.pipe(
    switchMap((cfg) => {
      switch (cfg.darkMode) {
        case 'dark':
          return of(true);
        case 'light':
          return of(false);
        default:
          const darkModePreference = window.matchMedia('(prefers-color-scheme: dark)');
          return fromEvent(darkModePreference, 'change').pipe(
            map((e: any) => e.matches),
            startWith(darkModePreference.matches),
          );
      }
    }),
    distinctUntilChanged(),
  );

  backgroundImg$: Observable<string | null> = combineLatest([
    this._workContextService.currentTheme$,
    this.isDarkTheme$,
  ]).pipe(
    map(([theme, isDarkMode]) =>
      isDarkMode ? theme.backgroundImageDark : theme.backgroundImageLight,
    ),
    distinctUntilChanged(),
  );

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private _materialCssVarsService: MaterialCssVarsService,
    private _workContextService: WorkContextService,
    private _globalConfigService: GlobalConfigService,
    private _matIconRegistry: MatIconRegistry,
    private _domSanitizer: DomSanitizer,
    private _chartThemeService: NgChartThemeService,
    private _chromeExtensionInterfaceService: ChromeExtensionInterfaceService,
    private _imexMetaService: ImexMetaService,
  ) {}

  init(): void {
    // This is here to make web page reloads on non work context pages at least usable
    this._setBackgroundGradient(true);
    this._initIcons();
    this._initHandlersForInitialBodyClasses();
    this._initThemeWatchers();
  }

  private _setDarkTheme(isDarkTheme: boolean): void {
    this._materialCssVarsService.setDarkTheme(isDarkTheme);
    this._setChartTheme(isDarkTheme);
    // this._materialCssVarsService.setDarkTheme(true);
    // this._materialCssVarsService.setDarkTheme(false);
  }

  private _setColorTheme(theme: WorkContextThemeCfg): void {
    this._materialCssVarsService.setAutoContrastEnabled(theme.isAutoContrast);
    this._setBackgroundGradient(theme.isDisableBackgroundGradient);

    if (!theme.isAutoContrast) {
      this._materialCssVarsService.setContrastColorThresholdPrimary(theme.huePrimary);
      this._materialCssVarsService.setContrastColorThresholdAccent(theme.hueAccent);
      this._materialCssVarsService.setContrastColorThresholdWarn(theme.hueWarn);
    }

    this._materialCssVarsService.setPrimaryColor(theme.primary);
    this._materialCssVarsService.setAccentColor(theme.accent);
    this._materialCssVarsService.setWarnColor(theme.warn);
  }

  private _setBackgroundGradient(isDisableBackgroundGradient: boolean): void {
    if (isDisableBackgroundGradient) {
      this.document.body.classList.add(BodyClass.isDisableBackgroundGradient);
      this.document.body.classList.remove(BodyClass.isEnabledBackgroundGradient);
    } else {
      this.document.body.classList.add(BodyClass.isEnabledBackgroundGradient);
      this.document.body.classList.remove(BodyClass.isDisableBackgroundGradient);
    }
  }

  private _initIcons(): void {
    const icons = [
      ['sp', 'assets/icons/sp.svg'],
      ['play', 'assets/icons/play.svg'],
      ['github', 'assets/icons/github.svg'],
      ['gitlab', 'assets/icons/gitlab.svg'],
      ['jira', 'assets/icons/jira.svg'],
      ['caldav', 'assets/icons/caldav.svg'],
      ['open_project', 'assets/icons/open-project.svg'],
      ['drag_handle', 'assets/icons/drag-handle.svg'],
      ['remove_today', 'assets/icons/remove-today-48px.svg'],
      ['estimate_remaining', 'assets/icons/estimate-remaining.svg'],
      ['working_today', 'assets/icons/working-today.svg'],
      ['repeat', 'assets/icons/repeat.svg'],
      ['gitea', 'assets/icons/gitea.svg'],
      ['redmine', 'assets/icons/redmine.svg'],
    ];

    icons.forEach(([name, path]) => {
      this._matIconRegistry.addSvgIcon(
        name,
        this._domSanitizer.bypassSecurityTrustResourceUrl(path),
      );
    });
  }

  private _initThemeWatchers(): void {
    // init theme watchers
    this._workContextService.currentTheme$.subscribe((theme: WorkContextThemeCfg) =>
      this._setColorTheme(theme),
    );
    this.isDarkTheme$.subscribe((isDarkTheme) => this._setDarkTheme(isDarkTheme));
  }

  private _initHandlersForInitialBodyClasses(): void {
    this.document.body.classList.add(BodyClass.isNoAdvancedFeatures);

    if (!IS_FIREFOX) {
      this.document.body.classList.add(BodyClass.isNoFirefox);
    }

    if (IS_MAC) {
      this.document.body.classList.add(BodyClass.isMac);
    } else {
      this.document.body.classList.add(BodyClass.isNoMac);
    }

    if (IS_ELECTRON) {
      this.document.body.classList.add(BodyClass.isElectron);
      this.document.body.classList.add(BodyClass.isAdvancedFeatures);
      this.document.body.classList.remove(BodyClass.isNoAdvancedFeatures);
    } else {
      this.document.body.classList.add(BodyClass.isWeb);
      this._chromeExtensionInterfaceService.onReady$.pipe(take(1)).subscribe(() => {
        this.document.body.classList.add(BodyClass.isExtension);
        this.document.body.classList.add(BodyClass.isAdvancedFeatures);
        this.document.body.classList.remove(BodyClass.isNoAdvancedFeatures);
      });
    }

    this._globalConfigService.misc$.subscribe((misc) => {
      if (misc.isDisableAnimations) {
        this.document.body.classList.add(BodyClass.isDisableAnimations);
      } else {
        this.document.body.classList.remove(BodyClass.isDisableAnimations);
      }
    });

    this._imexMetaService.isDataImportInProgress$.subscribe((isInProgress) => {
      // timer(1000, 5000)
      //   .pipe(map((val) => val % 2 === 0))
      //   .subscribe((isInProgress) => {
      if (isInProgress) {
        this.document.body.classList.add(BodyClass.isDataImportInProgress);
      } else {
        this.document.body.classList.remove(BodyClass.isDataImportInProgress);
      }
    });

    if (IS_TOUCH_ONLY) {
      this.document.body.classList.add(BodyClass.isTouchOnly);
    } else {
      this.document.body.classList.add(BodyClass.isNoTouchOnly);
    }

    if (IS_MOUSE_PRIMARY) {
      this.document.body.classList.add(BodyClass.isMousePrimary);
    } else if (IS_TOUCH_PRIMARY) {
      this.document.body.classList.add(BodyClass.isTouchPrimary);
    }
  }

  private _setChartTheme(isDarkTheme: boolean): void {
    const overrides = isDarkTheme
      ? {
          legend: {
            labels: { fontColor: 'white' },
          },
          scales: {
            xAxes: [
              {
                ticks: { fontColor: 'white' },
                gridLines: { color: 'rgba(255,255,255,0.1)' },
              },
            ],
            yAxes: [
              {
                ticks: { fontColor: 'white' },
                gridLines: { color: 'rgba(255,255,255,0.1)' },
              },
            ],
          },
        }
      : {};
    this._chartThemeService.setColorschemesOptions(overrides);
  }
}
