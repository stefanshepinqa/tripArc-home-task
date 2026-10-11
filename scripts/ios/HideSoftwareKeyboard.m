#import <Foundation/Foundation.h>
#import <objc/message.h>
#import <objc/runtime.h>

// iOS 18 shows the software keyboard even when a hardware keyboard is connected.
// Checkout buttons are pinned under that keyboard, outside the scroll view.
// Blocking the show path leaves the field focused so hardware typing still works.

static BOOL zeroArgument(const char *types) {
  if (!types || types[0] != 'v') return NO;
  int colons = 0;
  for (const char *cursor = types; *cursor; cursor++) {
    if (*cursor == ':') colons++;
  }
  return colons == 1;
}

static void suppressSoftwareKeyboard(id self, SEL _cmd) {
  SEL suppress = sel_registerName("_setShouldSuppressSoftwareKeyboard:");
  if ([self respondsToSelector:suppress]) {
    ((void (*)(id, SEL, BOOL))objc_msgSend)(self, suppress, YES);
  }
  (void)_cmd;
}

static void blockShows(Class cls) {
  const char *names[] = {
    "showKeyboard", "showKeyboardIfNeeded", "showKeyboardWithoutSuppressionPolicy", NULL,
  };
  for (int index = 0; names[index]; index++) {
    Method method = class_getInstanceMethod(cls, sel_registerName(names[index]));
    if (!method || !zeroArgument(method_getTypeEncoding(method))) continue;
    method_setImplementation(method, (IMP)suppressSoftwareKeyboard);
  }
}

static void hideSoftwareKeyboard(void) {
  Class cls = objc_getClass("UIKeyboardImpl");
  if (!cls) return;
  static BOOL installed = NO;
  if (!installed) {
    blockShows(cls);
    installed = YES;
  }
  id shared = ((id (*)(id, SEL))objc_msgSend)(cls, sel_registerName("sharedInstance"));
  if (!shared) return;
  SEL suppress = sel_registerName("_setShouldSuppressSoftwareKeyboard:");
  if ([shared respondsToSelector:suppress]) {
    ((void (*)(id, SEL, BOOL))objc_msgSend)(shared, suppress, YES);
  }
  SEL hardware = sel_registerName("setInHardwareKeyboardMode:");
  if ([shared respondsToSelector:hardware]) {
    ((void (*)(id, SEL, BOOL))objc_msgSend)(shared, hardware, YES);
  }
  SEL hide = sel_registerName("hideKeyboard");
  if ([shared respondsToSelector:hide]) {
    ((void (*)(id, SEL))objc_msgSend)(shared, hide);
  }
}

__attribute__((constructor))
static void install(void) {
  NSLog(@"HideSoftwareKeyboard loaded");
  hideSoftwareKeyboard();
  dispatch_async(dispatch_get_main_queue(), ^{
    hideSoftwareKeyboard();
  });
}
