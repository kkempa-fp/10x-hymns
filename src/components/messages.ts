export const messages = {
  app: {
    name: "10x Hymns",
    subtitle: "Generator propozycji pieśni i menedżer zestawów liturgicznych",
    authorLabel: "Autor:",
    authorName: "Krzysztof Kempa",
    authorEmail: "kkempa@future-processing.com",
    authorOrganization: "Future Processing",
    partnerName: "10x Devs",
    loginButton: "Zaloguj się",
    logoutButton: "Wyloguj się",
  },
  common: {
    buttons: {
      close: "Zamknij",
      cancel: "Anuluj",
      delete: "Usuń",
      edit: "Edytuj",
      retry: "Spróbuj ponownie",
    },
    loading: {
      deleting: "Usuwanie...",
      saving: "Zapisywanie...",
      loggingIn: "Logowanie...",
      registering: "Rejestracja...",
      generating: "Generowanie...",
    },
    placeholders: {
      email: "jan.kowalski@example.com",
      setName: "np. 29 Niedziela Zwykła (rok C)",
      setContent: "np. We: Spojrzyj z nieba wysokiego (1-2)",
      suggestionInput: "Tutaj wklej lub wpisz tekst antyfony, czytań lub krótki opis liturgii...",
    },
    fallback: {
      setName: "wybrany zestaw",
      emptyValue: "—",
      noDescription: "Brak opisu",
    },
    errors: {
      network: "Nie udało się połączyć z serwerem. Sprawdź połączenie z internetem i spróbuj ponownie.",
      unknown: "Wystąpił nieznany błąd.",
      deleteSetFailed: "Nie udało się usunąć zestawu. Spróbuj ponownie.",
      saveSetFailed: "Nie udało się zapisać zestawu. Spróbuj ponownie.",
      fetchSuggestionsFailed: "Nie udało się pobrać sugestii. Spróbuj ponownie.",
      submitRatingFailed: "Nie udało się zapisać oceny. Spróbuj ponownie.",
      processRequestFailed: "Nie udało się przetworzyć żądania.",
      readResponseFailed: "Nie udało się odczytać odpowiedzi serwera.",
    },
  },
  auth: {
    modal: {
      loginTitle: "Zaloguj się",
      registerTitle: "Załóż konto",
      loginTab: "Logowanie",
      registerTab: "Rejestracja",
    },
    login: {
      emailLabel: "Adres e-mail",
      passwordLabel: "Hasło",
      submit: "Zaloguj się",
      disclaimer: "Po zalogowaniu uzyskasz dostęp do pełnej wersji z embeddingami.",
    },
    register: {
      emailLabel: "Adres e-mail",
      passwordLabel: "Hasło",
      confirmPasswordLabel: "Powtórz hasło",
      submit: "Załóż konto",
      footer:
        "Po rejestracji wyślemy do Ciebie wiadomość z linkiem aktywacyjnym. Zalogujesz się po potwierdzeniu adresu e-mail.",
    },
    validation: {
      emailRequired: "Podaj adres e-mail.",
      emailInvalid: "Podaj poprawny adres e-mail.",
      passwordRequired: "Podaj hasło.",
      passwordMin: "Hasło musi mieć co najmniej 8 znaków.",
      passwordUppercase: "Hasło powinno zawierać przynajmniej jedną wielką literę.",
      passwordDigit: "Hasło powinno zawierać przynajmniej jedną cyfrę.",
      confirmPasswordRequired: "Potwierdź hasło.",
      passwordsMismatch: "Hasła muszą być identyczne.",
    },
    info: {
      verificationSent:
        "Na podany adres e-mail wysłaliśmy link aktywacyjny. Kliknij w niego, aby dokończyć rejestrację i zalogować się.",
      emailConfirmed: "Adres e-mail został potwierdzony. Zaloguj się, aby rozpocząć korzystanie z aplikacji.",
    },
    errors: {
      sessionFetchFailed: "Nie udało się pobrać informacji o sesji.",
      loginFailed: "Nie udało się zalogować.",
      registerFailed: "Nie udało się zarejestrować użytkownika.",
      logoutFailed: "Nie udało się wylogować.",
      tooManyLoginAttempts: "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.",
      sessionApiFailed: "Nie udało się pobrać sesji użytkownika.",
      userFetchFailed: "Nie udało się pobrać danych użytkownika.",
      invalidCredentials: "Nieprawidłowy adres e-mail lub hasło.",
      emailNotConfirmed: "Adres e-mail nie został jeszcze potwierdzony. Sprawdź skrzynkę pocztową.",
      invalidPayload: "Nieprawidłowe dane logowania.",
      invalidRegisterPayload: "Nieprawidłowe dane rejestracji.",
      userAlreadyExists: "Użytkownik z tym adresem e-mail już istnieje.",
    },
    success: {
      login: "Zalogowano pomyślnie.",
      register: "Konto zostało utworzone.",
      logout: "Wylogowano pomyślnie.",
    },
  },
  mainView: {
    tabs: {
      generator: "Generator",
      sets: "Zestawy",
    },
  },
  suggestion: {
    title: "Generator sugestii pieśni",
    description:
      "Wpisz fragment liturgii lub temat przewodni, a my zaproponujemy pieśni pasujące do Twojej celebracji.",
    requireInput: "Wpisz krótki opis liturgii, aby otrzymać sugestie.",
    banner: {
      loggedIn: "Jesteś zalogowany. Generator korzysta z embeddingów Google Gemini dla najtrafniejszych podpowiedzi.",
      guest:
        "Korzystasz z wersji demo – prezentujemy przykładowe propozycje. Zaloguj się, aby włączyć pełną wersję z embeddingami.",
    },
    form: {
      inputLabel: "Treść antyfony lub czytań",
      outputLabel: "Proponowane pieśni",
      generate: "Generuj propozycje",
    },
    status: {
      full: (count: number) => `Otrzymano ${count} dopasowanych propozycji od modelu AI.`,
      demo: "Tryb demo: pokazujemy przykładowe propozycje. Zaloguj się, aby odblokować pełne rekomendacje.",
      ratingPositive: "Dziękujemy za pozytywną opinię!",
      ratingNegative: "Zapisaliśmy Twoją uwagę.",
    },
    counts: {
      pending: (count: number) => `Otrzymasz ${count} propozycji, gdy tylko zakończymy generowanie.`,
      full: (count: number) => `Otrzymasz ${count} dopasowanych pieśni wygenerowanych przez model AI.`,
      demo: (count: number) =>
        `Tryb demo zwraca ${count} przykładowych pieśni. Zaloguj się, aby uzyskać dokładniejsze wyniki.`,
    },
    rating: {
      buttons: {
        up: "👍 Dobre propozycje",
        down: "👎 Nietrafione sugestie",
      },
      lastPrefix: "Ostatnia ocena:",
      lastPositive: "pozytywna",
      lastNegative: "negatywna",
    },
    errors: {
      upstreamUnavailable:
        "Nie udało się wygenerować propozycji, ponieważ usługa AI jest tymczasowo niedostępna. Spróbuj ponownie za kilka minut lub skontaktuj się z administratorem.",
    },
  },
  sets: {
    manager: {
      title: "Zarządzanie zestawami",
      description: "Przechowuj zestawy pieśni, aby łatwo korzystać z nich podczas przygotowania liturgii.",
      createButton: "Dodaj zestaw",
      searchLabel: "Wyszukaj zestaw",
      searchPlaceholder: "Szukaj po nazwie...",
      statusCreated: "Zestaw został utworzony.",
      statusUpdated: "Zestaw został zaktualizowany.",
      statusDeleted: "Zestaw został usunięty.",
      totalCount: (total: number) => `Łącznie ${total} zestawów`,
    },
    table: {
      emptyTitle: "Brak zestawów",
      emptyDescription: "Dodaj pierwszy zestaw, aby przechowywać i organizować propozycje pieśni.",
      columnName: "Nazwa zestawu",
      columnContent: "Opis / zawartość",
      columnUpdatedAt: "Ostatnia aktualizacja",
    },
    form: {
      titleCreate: "Dodaj nowy zestaw",
      titleEdit: "Edytuj zestaw",
      submitCreate: "Utwórz zestaw",
      submitEdit: "Zapisz zmiany",
      nameLabel: "Nazwa zestawu",
      contentLabel: "Opis / zawartość",
      contentHelper: "Opisz przeznaczenie zestawu lub wypisz pieśni, które powinny się w nim znaleźć.",
      nameRequired: "Nazwa zestawu jest wymagana.",
      nameDuplicate: "Zestaw o tej nazwie już istnieje.",
    },
    preview: {
      descriptionHeading: "Opis / zawartość",
    },
    errors: {
      listFetchFailed: "Nie udało się pobrać listy zestawów.",
      notFound: "Nie znaleziono zestawu.",
      unauthorized: "Musisz być zalogowany, aby zarządzać zestawami.",
    },
  },
  deleteSetDialog: {
    title: "Usuń zestaw",
    prompt: {
      prefix: "Czy na pewno chcesz usunąć zestaw",
      suffix: "? Tej operacji nie można cofnąć.",
    },
  },
  pagination: {
    previous: "Poprzednia",
    next: "Następna",
    summary: (current: number, total: number) => `Strona ${current} z ${total}`,
  },
  theme: {
    label: {
      light: "Jasny",
      dark: "Ciemny",
    },
    buttonPrefix: "Motyw:",
    ariaLabel: (current: string) => `Przełącz motyw (obecnie ${current})`,
    srLabel: (current: string) => `Przełącz motyw, aktualnie ${current}`,
  },
} as const;

type Messages = typeof messages;

type DeepRecord<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends Record<string, unknown>
    ? { [K in keyof T]: DeepRecord<T[K]> }
    : T;

export type AppMessages = DeepRecord<Messages>;
