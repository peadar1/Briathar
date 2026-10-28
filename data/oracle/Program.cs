// Generates golden test fixtures by running Gramadán (github.com/michmech/Gramadan, MIT)
// over BuNaMo verb entries. The TypeScript engine must reproduce this output exactly.
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Encodings.Web;
using System.Text.Json;
using Gramadan;

string root = args.Length > 0 ? args[0] : Directory.GetCurrentDirectory();
string configPath = Path.Combine(root, "data", "verbs.config.json");
string bunamoDir = Path.Combine(root, "data", ".cache", "bunamo-verbs");
string outPath = Path.Combine(root, "packages", "conjugator", "test", "fixtures", "gramadan-golden.json");

using JsonDocument config = JsonDocument.Parse(File.ReadAllText(configPath));
IEnumerable<string> lemmas = config.RootElement.GetProperty("irregular").EnumerateArray()
    .Concat(config.RootElement.GetProperty("regular").EnumerateArray())
    .Select(e => e.GetProperty("lemma").GetString());

var tenses = new Dictionary<VPTense, string> {
    { VPTense.Past, "past" }, { VPTense.Pres, "presentBi" }, { VPTense.PresCont, "present" },
    { VPTense.Fut, "future" }, { VPTense.Cond, "conditional" },
};
var forms = new (VPShape shape, VPPolarity pol, string name)[] {
    (VPShape.Declar, VPPolarity.Pos, "affirmative"),
    (VPShape.Declar, VPPolarity.Neg, "negative"),
    (VPShape.Interrog, VPPolarity.Pos, "interrogative"),
    (VPShape.Interrog, VPPolarity.Neg, "negativeInterrogative"),
};
var persons = new Dictionary<VPPerson, string> {
    { VPPerson.Sg1, "sg1" }, { VPPerson.Sg2, "sg2" }, { VPPerson.Sg3Masc, "sg3m" }, { VPPerson.Sg3Fem, "sg3f" },
    { VPPerson.Pl1, "pl1" }, { VPPerson.Pl2, "pl2" }, { VPPerson.Pl3, "pl3" }, { VPPerson.Auto, "auto" },
};

var result = new SortedDictionary<string, object>(StringComparer.Ordinal);
foreach (string lemma in lemmas) {
    var vp = new VP(new Verb(Path.Combine(bunamoDir, lemma + "_verb.xml")));
    var verbOut = new Dictionary<string, object>();
    foreach (var (t, tName) in tenses) {
        var tenseOut = new Dictionary<string, object>();
        foreach (var (shape, pol, fName) in forms) {
            var formOut = new Dictionary<string, List<string>>();
            foreach (var (p, pName) in persons) {
                var values = vp.tenses[t][shape][p][pol].Select(f => f.value).ToList();
                if (values.Count > 0) formOut[pName] = values;
            }
            if (formOut.Count > 0) tenseOut[fName] = formOut;
        }
        if (tenseOut.Count > 0) verbOut[tName] = tenseOut;
    }
    result[lemma] = verbOut;
}

Directory.CreateDirectory(Path.GetDirectoryName(outPath));
var options = new JsonSerializerOptions { WriteIndented = true, Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };
File.WriteAllText(outPath, JsonSerializer.Serialize(result, options) + "\n");
Console.WriteLine($"Wrote {result.Count} verbs to {outPath}");
