const cn = (baseClass, ...classes) => {
  const validClasses = classes.filter(
    (cls) => !!(cls && typeof cls === "string" && cls.trim()),
  );
  return validClasses.length > 0
    ? `${baseClass} ${validClasses.join(" ")}`.trim()
    : baseClass;
};

console.log("cn('foo'): '" + cn('foo') + "'");
console.log("cn(' foo '): '" + cn(' foo ') + "'");
console.log("cn('foo', 'bar'): '" + cn('foo', 'bar') + "'");
console.log("cn(' foo ', ' bar '): '" + cn(' foo ', ' bar ') + "'");
console.log("cn('foo', undefined): '" + cn('foo', undefined) + "'");
console.log("cn('', 'bar'): '" + cn('', 'bar') + "'");
