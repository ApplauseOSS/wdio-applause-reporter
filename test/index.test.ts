import { ApplauseReporter } from "../src";

test('getDuplicates finds duplicates', () => {
  const res = ApplauseReporter.getDuplicates(['str1','str2','str1'])
  expect(res).toEqual(['str1']);
});

test('getExplanationForConfigOptionsLoadedFromMultiplePlaces finds duplicate sources', () => {
  const test = () => {
   ApplauseReporter.getExplanationForConfigOptionsLoadedFromMultiplePlaces(
       {
         options:{},
         source:'duplicate' 
        },
        {
          options:{},
          source:'duplicate' 
         }
     );
  };
  expect(test).toThrow('duplicate options sources, please make sure all options sources are named with unique string. Duplicates: ');
});

test('getExplanationForConfigOptionsLoadedFromMultiplePlaces ignores duplicated options with same value', () => {
  const test = () => {
    ApplauseReporter.getExplanationForConfigOptionsLoadedFromMultiplePlaces(
      {
        options:{dup:'dupe'},
        source:'options1' 
       },
       {
        options:{dup:'dupe'},
         source:'options2' 
        }
    );
  };
  expect(test).not.toThrow();
});
test(`getExplanationForConfigOptionsLoadedFromMultiplePlaces doesn't trigger when options don't overlap`, () => {
  const test = () => {
    ApplauseReporter.getExplanationForConfigOptionsLoadedFromMultiplePlaces(
      {
        options:{option1:'dupe'},
        source:'options1' 
       },
       {
        options:{option2:'dupe'},
         source:'options2' 
        }
    );
  };
  expect(test).not.toThrow();
});

test(`getExplanationForConfigOptionsLoadedFromMultiplePlaces throws with duplicate options and differing values`, () => {
    const res = ApplauseReporter.getExplanationForConfigOptionsLoadedFromMultiplePlaces(
      {
        options:{option:'diffvalue'},
        source:'options1' 
       },
       {
        options:{option:'othervalue'},
         source:'options2' 
        }
    );
  expect(res).toContain('Config Option \'option\' has multiple values!');
});